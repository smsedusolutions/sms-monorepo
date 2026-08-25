// apps/sm-transport-service/utils/socketManager.js
const socketIo = require('socket.io');
const { TransportRouteSchema, NotificationSchema } = require('@sms/shared/models');
const { getSchoolDbConnection } = require('../configs/db');
const { sendEmail, isOriginAllowed } = require('@sms/shared/utils');
const { v4: uuidv4 } = require('uuid');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                    return callback(null, true);
                }
                return callback(null, false);
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);

        // Join a route-specific room
        socket.on('join-route', async ({ schoolId, routeId }) => {
            const room = `${schoolId}_${routeId}`;
            socket.join(room);
            console.log(`📡 Client ${socket.id} joined route room: ${room}`);

            // Push initial data from DB if available
            try {
                const db = getSchoolDbConnection(`school-db-${schoolId}`);
                const Route = db.model('TransportRoute', TransportRouteSchema);
                const route = await Route.findOne({ routeId }).lean();
                
                if (route && route.currentLocation) {
                    socket.emit('location-update', {
                        ...route.currentLocation,
                        timestamp: route.currentLocation.lastUpdated || new Date()
                    });
                }
                
                if (route && route.currentTrip) {
                    socket.emit('trip-status', route.currentTrip);
                }
            } catch (err) {
                console.error("Error pushing initial route data:", err);
            }
        });

        // Driver starts trip / check-in
        socket.on('driver-check-in', async ({ schoolId, routeId, driverId, vehicleId }) => {
            const room = `${schoolId}_${routeId}`;
            socket.join(room);
            
            // 2. Update trip status in DB
            const db = getSchoolDbConnection(`school-db-${schoolId}`);
            const Route = db.model('TransportRoute', TransportRouteSchema);
            await Route.findOneAndUpdate({ routeId }, {
                'currentTrip.status': 'on-time',
                'currentTrip.startTime': new Date(),
                'currentTrip.lastCheckIn': new Date(),
                driverId, vehicleId
            }, { upsert: false });

            console.log(`🚛 Driver ${driverId} checked in for route ${routeId}`);
            io.to(room).emit('trip-started', { routeId, startTime: new Date() });
        });

        // Driver broadcasts location
        socket.on('update-location', async (data) => {
            const { schoolId, routeId, latitude, longitude, speed, heading } = data;
            const room = `${schoolId}_${routeId}`;

            // 1. Broadcast to all (parents) in the room
            io.to(room).emit('location-update', { latitude, longitude, speed, heading, timestamp: new Date() });

            // 2. Persist in DB (throttle this in production)
            const db = getSchoolDbConnection(`school-db-${schoolId}`);
            const Route = db.model('TransportRoute', TransportRouteSchema);
            const route = await Route.findOneAndUpdate({ routeId }, {
                currentLocation: { latitude, longitude, speed, heading, lastUpdated: new Date() },
                'currentTrip.lastCheckIn': new Date()
            }, { new: true }).lean();

            // 3. Proximity Check (500m logic)
            if (route && route.stops) {
                checkProximity(route, schoolId, latitude, longitude);
            }
        });

        // Driver ends trip / check-out
        socket.on('driver-check-out', async ({ schoolId, routeId }) => {
            const room = `${schoolId}_${routeId}`;
            
            const db = getSchoolDbConnection(`school-db-${schoolId}`);
            const Route = db.model('TransportRoute', TransportRouteSchema);
            await Route.findOneAndUpdate({ routeId }, {
                'currentTrip.status': 'stopped',
                'currentTrip.endTime': new Date()
            });

            console.log(`🚛 Driver checked out for route ${routeId}`);
            io.to(room).emit('trip-stopped', { routeId, endTime: new Date() });
        });

        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
        });
    });

    return io;
};

// Simple Haversine distance for 500m proximity
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

async function checkProximity(route, schoolId, busLat, busLon) {
    const db = getSchoolDbConnection(`school-db-${schoolId}`);
    const Notification = db.model('Notification', NotificationSchema);

    for (const stop of route.stops) {
        const distance = calculateDistance(busLat, busLon, stop.latitude, stop.longitude);
        
        // If within 500m and not already notified in the last 15 mins (basic debounce)
        if (distance <= 500) {
            // Logic to send notification to students at this stop
            for (const student of stop.students || []) {
                if (student.parentId) {
                    const title = `🚌 Bus Approaching: ${stop.name}`;
                    const message = `The bus is approximately 500m away from ${stop.name}. Please be ready!`;

                    // Create In-App Notification
                    await Notification.create({
                        notificationId: uuidv4(),
                        schoolId,
                        userId: student.parentId,
                        userRole: 'parent',
                        title, message,
                        type: 'bus_proximity',
                        referenceId: route.routeId,
                        referenceType: 'transport'
                    });

                    // Send Email
                    if (student.parentEmail) {
                        sendEmail({ to: student.parentEmail, subject: title, html: `<p>${message}</p>` });
                    }
                }
            }
        }
    }
}

module.exports = { initSocket };
