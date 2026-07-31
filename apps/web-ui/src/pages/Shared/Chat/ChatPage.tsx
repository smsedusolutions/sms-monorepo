import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Fab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  ChildCare as ChildIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ContentCopy as CopyIcon,
  GetApp as DownloadIcon,
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  ShieldOutlined as ShieldIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import TokenService from "../../../queries/token/tokenService";
import { chatApi } from "../../../queries/chat/chatApi";
import { chatSocket } from "../../../services/chatSocket";
import useApi from "../../../queries/useApi";
import {
  getOrInitializeUserKeys,
  importPublicKey,
  deriveSharedKey,
  encryptText,
  decryptText,
  encryptFileBuffer,
  decryptFileBuffer,
} from "../../../utils/crypto/e2ee";
import { useGetParents } from "../../../queries/Parent";
import { useGetClasses } from "../../../queries/Class";
import { useGetTeachers, useGetTeacherById } from "../../../queries/Teacher";
import { useGetSubjects } from "../../../queries/Subject";
import { useGetChildTeachers, useGetMyChildren } from "../../../queries/ParentPortal";
import { useTimeSettingsStore } from "../../../stores/timeSettingsStore";
import { formatSingleTime } from "../../../utils/timeUtils";
import type { Parent, Teacher, Subject, ChildTeacherInfo, Class as ClassType } from "../../../types";

interface DecryptedMessage {
  _id: string;
  roomId: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  text: string;
  status: "sent" | "delivered" | "read";
  messageType: "text" | "attachment" | "system";
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentIv?: string;
  createdAt: string;
}

export interface ContactInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  role: string;
  info: string;
  relationship?: string;
  isClassTeacher?: boolean;
  subjects?: string[];
  childrenDetails?: { studentId?: string; name: string; classSection?: string }[];
}

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPartnerId = searchParams.get("partnerId");
  const initialStudentId = searchParams.get("studentId");

  const schoolId = TokenService.getSchoolId() || "";
  const currentUser = TokenService.getUser();
  const currentUserId = (TokenService.getUserId() || currentUser?.userId || "").toString();
  const currentUserRole = (TokenService.getRole() || currentUser?.role || "").toLowerCase();
  const isTeacher = currentUserRole === "teacher";
  const isParent = currentUserRole === "parent";

  // Global Time Format Setting (12h vs 24h)
  const { timeFormat } = useTimeSettingsStore();

  // Tab State: 0 = Active Chats, 1 = Directory / Start New Chat
  const [activeTab, setActiveTab] = useState<number>(0);

  // Core Chat State
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Contact Info Popup Dialog State
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedContactInfo, setSelectedContactInfo] = useState<ContactInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Directory Filter State
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [directorySearch, setDirectorySearch] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Dynamic Contact Info Cache for room partners not in initial directory lists
  const [extraContacts, setExtraContacts] = useState<Map<string, ContactInfo>>(new Map());


  // E2EE keys initialization gate — prevents decrypting before private key is loaded
  const [keysReady, setKeysReady] = useState(false);

  // E2EE Keys Cache
  const ownKeyPairRef = useRef<CryptoKeyPair | null>(null);
  const sharedKeyCacheRef = useRef<Map<string, CryptoKey>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<any>(null);

  // Infinite Scroll & Pagination State
  const [chatPage, setChatPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);


  // Online / Last-seen State: Map of userId -> { isOnline, lastSeen }
  const [onlineStatusMap, setOnlineStatusMap] = useState<Map<string, { isOnline: boolean; lastSeen: string | null }>>(new Map());

  const setUserOnline = (userId: string) => {
    setOnlineStatusMap((prev) => {
      const next = new Map(prev);
      next.set(userId, { isOnline: true, lastSeen: null });
      return next;
    });
  };

  const setUserOffline = (userId: string, lastSeen: string | null) => {
    setOnlineStatusMap((prev) => {
      const next = new Map(prev);
      next.set(userId, { isOnline: false, lastSeen });
      return next;
    });
  };

  const getPartnerPresence = (partnerId: string) => {
    return onlineStatusMap.get(partnerId) || { isOnline: false, lastSeen: null };
  };


  // ----------------------------------------------------
  // Data Queries for Directory & Contact Resolution
  // ----------------------------------------------------
  const { data: allTeachersRes } = useGetTeachers(schoolId, { limit: 200 });
  const allTeachersList: Teacher[] = allTeachersRes?.data || [];

  const { data: teacherProfile } = useGetTeacherById(schoolId, isTeacher ? currentUserId : "");
  const { data: classesRes } = useGetClasses(schoolId);
  const allClasses: ClassType[] = classesRes?.data || [];

  const { data: subjectsRes } = useGetSubjects(schoolId);
  const allSubjectsList: Subject[] = subjectsRes?.data || [];

  const formatSubjectName = (rawSub?: string) => {
    if (!rawSub) return "";
    const found = allSubjectsList.find(
      (s) => s.subjectId === rawSub || s.code === rawSub || s._id === rawSub
    );
    return found ? found.name : rawSub;
  };

  const formatClassSectionName = (rawStr?: string) => {
    if (!rawStr) return "";
    let result = rawStr;
    allClasses.forEach((c) => {
      if (c.classId && result.includes(c.classId)) {
        result = result.replace(c.classId, c.name);
      }
      if (c.sections && Array.isArray(c.sections)) {
        c.sections.forEach((sec) => {
          if (sec.sectionId && result.includes(sec.sectionId)) {
            result = result.replace(sec.sectionId, sec.name);
          }
        });
      }
    });
    return result;
  };

  const teacherAssignedClasses = useMemo(() => {
    if (!isTeacher) return [];
    const rawClasses = teacherProfile?.data?.classes || [];
    if (rawClasses.length === 0) return allClasses;
    const parsedIds = rawClasses.map((c: string) => c.split("#")[0]);
    return allClasses.filter((c: ClassType) => parsedIds.includes(c.classId));
  }, [isTeacher, teacherProfile?.data?.classes, allClasses]);

  const { data: parentsRes, isLoading: isLoadingParents } = useGetParents(schoolId, {
    class: selectedClassId || undefined,
    search: directorySearch || undefined,
    limit: 200,
  });
  const parentDirectory: Parent[] = parentsRes?.data || [];

  const { data: myChildrenRes } = useGetMyChildren(isParent ? schoolId : "");
  const myChildren = myChildrenRes?.data || [];

  useEffect(() => {
    if (isParent && myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(initialStudentId || myChildren[0].studentId);
    }
  }, [isParent, myChildren, initialStudentId]);

  const { data: childTeachersRes, isLoading: isLoadingTeachers } = useGetChildTeachers(
    isParent ? schoolId : "",
    selectedChildId
  );
  const teacherDirectory: ChildTeacherInfo[] = childTeachersRes?.data || [];

  const filteredTeacherDirectory = useMemo(() => {
    if (!directorySearch.trim()) return teacherDirectory;
    const q = directorySearch.toLowerCase();
    return teacherDirectory.filter((t) => {
      const name = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
      const subjects = (t.subjectNames || []).join(" ").toLowerCase();
      return name.includes(q) || subjects.includes(q);
    });
  }, [teacherDirectory, directorySearch]);

  const contactsMap = useMemo(() => {
    const map = new Map<string, ContactInfo>();

    allTeachersList.forEach((t) => {
      const rawSubs = t.subjectNames && t.subjectNames.length > 0 ? t.subjectNames : t.subjects || [];
      const formattedSubs = rawSubs.map(formatSubjectName);
      const subStr = formattedSubs.join(", ");

      map.set(t.teacherId, {
        id: t.teacherId,
        name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Teacher",
        email: t.email,
        phone: t.phone,
        profileImage: t.profileImage,
        role: "Teacher",
        info: subStr ? `Subjects: ${subStr}` : t.department ? `Department: ${t.department}` : "Faculty",
        subjects: formattedSubs,
      });
    });

    parentDirectory.forEach((p) => {
      const childrenNamesList = p.childrenNames || [];
      const childrenDetails = p.childrenDetails || childrenNamesList.map((n) => ({ name: n }));
      const childrenStr = childrenNamesList.join(", ");

      map.set(p.parentId, {
        id: p.parentId,
        name: `${p.firstName} ${p.lastName}`.trim(),
        email: p.email,
        phone: p.phone,
        profileImage: p.profileImage,
        relationship: p.relationship,
        info: childrenStr ? `Parent of ${childrenStr}` : "Parent Contact",
        role: "Parent",
        childrenDetails,
      });
    });

    teacherDirectory.forEach((t) => {
      const rawSubs = t.subjectNames && t.subjectNames.length > 0 ? t.subjectNames : t.subjects || [];
      const formattedSubs = rawSubs.map(formatSubjectName);
      const subStr = formattedSubs.join(", ");
      const connectedKids = myChildren.map((c) => `${c.firstName} ${c.lastName}`);

      map.set(t.teacherId, {
        id: t.teacherId,
        name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Teacher",
        email: t.email,
        phone: t.phone,
        profileImage: t.profileImage,
        isClassTeacher: t.isClassTeacher,
        subjects: formattedSubs,
        info: t.isClassTeacher ? `Class Teacher ${subStr ? `(${subStr})` : ""}` : subStr || "Subject Teacher",
        role: t.isClassTeacher ? "Class Teacher" : "Teacher",
        childrenDetails: connectedKids.map((name) => ({ name })),
      });
    });

    extraContacts.forEach((contact, partnerId) => {
      map.set(partnerId, contact);
    });

    return map;
  }, [allTeachersList, parentDirectory, teacherDirectory, myChildren, allSubjectsList, extraContacts]);


  const handleCopyField = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenInfoModal = (partnerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const contact = contactsMap.get(partnerId);

    if (contact) {
      setSelectedContactInfo(contact);
    } else {
      setSelectedContactInfo({
        id: partnerId,
        name: isParent ? `Teacher (${partnerId})` : `Parent (${partnerId})`,
        role: isParent ? "Teacher" : "Parent",
        info: isParent ? "Teacher Contact" : "Parent Contact",
      });
    }
    setInfoModalOpen(true);
  };

  // ----------------------------------------------------
  // 1. Initialize E2EE Keys & WebSocket Gateway
  // ----------------------------------------------------
  useEffect(() => {
    if (!currentUserId) return;

    async function initKeys() {
      try {
        const { keyPair, publicKeyBase64 } = await getOrInitializeUserKeys(currentUserId);
        ownKeyPairRef.current = keyPair;
        await chatApi.registerKeys(publicKeyBase64);
        console.log("🔐 [E2EE] Client Public Keys Registered Successfully");
        setKeysReady(true); // Signal that keys are ready for decryption
      } catch (err) {
        console.error("❌ E2EE Key Initialization Error:", err);
      }
    }

    initKeys();
    chatSocket.connect();

    return () => {
      chatSocket.disconnect();
    };
  }, [currentUserId]);


  // ----------------------------------------------------
  // 2. Fetch Rooms & Auto-Select Room if Partner ID Provided
  // ----------------------------------------------------
  useEffect(() => {
    fetchRooms();
  }, [initialPartnerId]);

  // Dynamically resolve contact details for room partners missing from directory
  useEffect(() => {
    if (!schoolId || !rooms || rooms.length === 0) return;

    rooms.forEach(async (room) => {
      const partnerId = getPartnerId(room);
      if (!partnerId) return;

      if (!contactsMap.has(partnerId)) {
        try {
          if (currentUserRole === "teacher" || currentUserRole === "admin" || currentUserRole === "superadmin") {
            const res = await useApi<any>("GET", `/api/school/${schoolId}/parents/${partnerId}`);
            if (res?.success && res.data) {
              const p = res.data;
              const childrenNamesList = p.childrenNames || [];
              const childrenDetails = p.childrenDetails || childrenNamesList.map((n: string) => ({ name: n }));
              const childrenStr = childrenNamesList.join(", ");
              setExtraContacts((prev) => {
                if (prev.has(partnerId)) return prev;
                const next = new Map(prev);
                next.set(partnerId, {
                  id: partnerId,
                  name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Parent (${partnerId})`,
                  email: p.email,
                  phone: p.phone,
                  profileImage: p.profileImage,
                  relationship: p.relationship,
                  info: childrenStr ? `Parent of ${childrenStr}` : "Parent Contact",
                  role: "Parent",
                  childrenDetails,
                });
                return next;
              });
            }
          } else if (currentUserRole === "parent") {
            const res = await useApi<any>("GET", `/api/school/${schoolId}/teachers/${partnerId}`);
            if (res?.success && res.data) {
              const t = res.data;
              setExtraContacts((prev) => {
                if (prev.has(partnerId)) return prev;
                const next = new Map(prev);
                next.set(partnerId, {
                  id: partnerId,
                  name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || `Teacher (${partnerId})`,
                  email: t.email,
                  phone: t.phone,
                  profileImage: t.profileImage,
                  role: "Teacher",
                  info: t.department ? `Department: ${t.department}` : "Teacher Contact",
                });
                return next;
              });
            }
          }
        } catch (err) {
          console.warn(`Could not fetch extra contact info for ${partnerId}:`, err);
        }
      }
    });
  }, [rooms, schoolId, currentUserRole, contactsMap]);


  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      if (initialPartnerId) {
        const res = await chatApi.getOrCreateRoom(initialPartnerId, initialStudentId || undefined);
        if (res.success && res.data) {
          setSelectedRoom(res.data);
          setActiveTab(0);
        }
      }

      const resRooms = await chatApi.getRooms();
      if (resRooms.success) {
        setRooms(resRooms.data || []);
        if (!initialPartnerId && resRooms.data?.length > 0 && window.innerWidth >= 900) {
          setSelectedRoom(resRooms.data[0]);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching rooms:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleStartChatWithPartner = async (partnerUserId: string, studentIdContext?: string) => {
    try {
      setIsLoadingRooms(true);
      const res = await chatApi.getOrCreateRoom(partnerUserId, studentIdContext);
      if (res.success && res.data) {
        setSelectedRoom(res.data);
        setActiveTab(0);
        await fetchRooms();
      }
    } catch (err) {
      console.error("❌ Error starting chat:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const getSharedKeyForPartner = async (partnerId: string): Promise<CryptoKey | null> => {
    if (sharedKeyCacheRef.current.has(partnerId)) {
      return sharedKeyCacheRef.current.get(partnerId)!;
    }

    if (!ownKeyPairRef.current) return null;

    try {
      const res = await chatApi.getUserKeys(partnerId);
      if (!res.success || !res.data?.identityPublicKey) {
        console.warn(`⚠️ Partner ${partnerId} has not registered public keys yet.`);
        return null;
      }

      const partnerPublicKey = await importPublicKey(res.data.identityPublicKey);
      const sharedKey = await deriveSharedKey(ownKeyPairRef.current.privateKey, partnerPublicKey);
      sharedKeyCacheRef.current.set(partnerId, sharedKey);
      return sharedKey;
    } catch (e) {
      console.error("❌ Error deriving shared key:", e);
      return null;
    }
  };

  // Ref to track if a room was selected before keys were ready
  const pendingRoomLoadRef = useRef<{ roomId: string; partnerId: string } | null>(null);

  // ----------------------------------------------------
  // 3a. Room Selected Effect — fires ONLY when room changes
  // ----------------------------------------------------
  useEffect(() => {
    if (!selectedRoom) return;

    const roomId = selectedRoom._id;
    const partnerId = getPartnerId(selectedRoom);

    // Always: reset unread, mark read, fetch presence
    setRooms((prevRooms) =>
      prevRooms.map((r) =>
        r._id === roomId
          ? { ...r, unreadCountParent: 0, unreadCountTeacher: 0 }
          : r
      )
    );
    chatApi.markAsRead(roomId);
    chatSocket.sendMarkRead(roomId);
    chatApi.getOnlineStatus(partnerId).then((res) => {
      if (res?.success && res.data) {
        if (res.data.isOnline) setUserOnline(partnerId);
        else setUserOffline(partnerId, res.data.lastSeen || null);
      }
    }).catch(() => { });

    if (keysReady) {
      // Keys already available — load messages immediately for THIS room only
      loadRoomMessages(roomId, partnerId);
    } else {
      // Keys not ready yet — store as pending; will load once keys finish
      pendingRoomLoadRef.current = { roomId, partnerId };
    }
  }, [selectedRoom?._id]); // <-- does NOT depend on keysReady

  // ----------------------------------------------------
  // 3b. Keys Ready Effect — fires ONLY when keysReady transitions to true
  // ----------------------------------------------------
  useEffect(() => {
    if (!keysReady) return;
    // If a room was waiting for keys, load it now
    if (pendingRoomLoadRef.current) {
      const { roomId, partnerId } = pendingRoomLoadRef.current;
      pendingRoomLoadRef.current = null;
      loadRoomMessages(roomId, partnerId);
    }
  }, [keysReady]); // <-- does NOT depend on selectedRoom


  const decryptMessageList = async (rawMessages: any[], sharedKey: CryptoKey | null): Promise<DecryptedMessage[]> => {
    const decryptedList: DecryptedMessage[] = [];
    for (const msg of rawMessages) {
      let text = "[Encrypted Message]";
      let activeKey = sharedKey;

      if (msg.encryptedPayload) {
        if (!activeKey) {
          const partnerId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
          activeKey = await getSharedKeyForPartner(partnerId);
        }

        if (activeKey) {
          try {
            text = await decryptText(msg.encryptedPayload, activeKey);
          } catch (e) {
            // Attempt key cache invalidation and re-fetch partner's latest public key
            const partnerId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
            sharedKeyCacheRef.current.delete(partnerId);
            const freshKey = await getSharedKeyForPartner(partnerId);
            if (freshKey) {
              try {
                text = await decryptText(msg.encryptedPayload, freshKey);
              } catch (retryErr) {
                text = "🔒 [Encrypted Message - Key mismatch]";
              }
            } else {
              text = "🔒 [Encrypted Message - Key unavailable]";
            }
          }
        }
      }

      const rawFileUrl = msg.attachmentId?.fileUrl;
      const rawFileName = text.includes("Attached file:")
        ? text.split("Attached file:")[1]?.trim()
        : "encrypted_attachment";

      decryptedList.push({
        _id: msg._id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        recipientId: msg.recipientId,
        text,
        status: msg.status,
        messageType: msg.messageType,
        attachmentUrl: rawFileUrl,
        attachmentName: rawFileName,
        attachmentIv: msg.attachmentId?.iv,
        createdAt: msg.createdAt,
      });
    }
    return decryptedList;
  };

  const loadRoomMessages = async (roomId: string, partnerId: string) => {
    setIsLoadingMessages(true);
    setChatPage(1);
    setHasMoreMessages(false);
    try {
      const res = await chatApi.getRoomMessages(roomId, 1, 50);
      if (res.success && Array.isArray(res.data)) {
        const sharedKey = await getSharedKeyForPartner(partnerId);
        const decryptedList = await decryptMessageList(res.data, sharedKey);
        setMessages(decryptedList);
        if (res.pagination) {
          setHasMoreMessages(res.pagination.page < res.pagination.pages);
        }
      }
    } catch (err) {
      console.error("❌ Error loading messages:", err);
    } finally {
      setIsLoadingMessages(false);
      scrollToBottom();
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedRoom || isLoadingMore || !hasMoreMessages || isLoadingMessages) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const oldScrollHeight = viewport.scrollHeight;
    const oldScrollTop = viewport.scrollTop;

    setIsLoadingMore(true);
    const partnerId = getPartnerId(selectedRoom);
    const nextPage = chatPage + 1;

    try {
      const res = await chatApi.getRoomMessages(selectedRoom._id, nextPage, 50);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sharedKey = await getSharedKeyForPartner(partnerId);
        const decryptedList = await decryptMessageList(res.data, sharedKey);

        setMessages((prev) => [...decryptedList, ...prev]);
        setChatPage(nextPage);
        if (res.pagination) {
          setHasMoreMessages(res.pagination.page < res.pagination.pages);
        }

        // Restore scroll position after prepend so viewport does not jump
        requestAnimationFrame(() => {
          if (viewport) {
            const newScrollHeight = viewport.scrollHeight;
            viewport.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error("❌ Error loading older messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleViewportScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 60 && hasMoreMessages && !isLoadingMore && !isLoadingMessages) {
      loadMoreMessages();
    }
  };


  // ----------------------------------------------------
  // 4. Real-time WebSocket Listeners
  // ----------------------------------------------------
  useEffect(() => {
    const unsubNewMsg = chatSocket.on("new_message", async ({ payload }) => {
      if (selectedRoom && payload.roomId === selectedRoom._id) {
        const partnerId = getPartnerId(selectedRoom);
        let sharedKey = await getSharedKeyForPartner(partnerId);
        let text = "[Encrypted Message]";

        if (payload.encryptedPayload) {
          if (sharedKey) {
            try {
              text = await decryptText(payload.encryptedPayload, sharedKey);
            } catch (e) {
              // Retry with fresh key fetch if first attempt fails
              sharedKeyCacheRef.current.delete(partnerId);
              sharedKey = await getSharedKeyForPartner(partnerId);
              if (sharedKey) {
                try {
                  text = await decryptText(payload.encryptedPayload, sharedKey);
                } catch (err2) {
                  text = "🔒 [Encrypted Message]";
                }
              }
            }
          }
        }

        const rawFileUrl = payload.attachmentId?.fileUrl;
        const rawFileName = text.includes("Attached file:")
          ? text.split("Attached file:")[1]?.trim()
          : "encrypted_attachment";

        const newMsg: DecryptedMessage = {
          _id: payload.id || `temp_${Date.now()}`,
          roomId: payload.roomId,
          senderId: payload.senderId,
          senderRole: payload.senderRole,
          recipientId: payload.recipientId,
          text,
          status: "delivered",
          messageType: payload.messageType || "text",
          attachmentUrl: rawFileUrl,
          attachmentName: rawFileName,
          attachmentIv: payload.attachmentId?.iv,
          createdAt: payload.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        chatApi.markAsRead(selectedRoom._id);
        chatSocket.sendMarkRead(selectedRoom._id);
        scrollToBottom();
      }

      fetchRooms();
    });

    const unsubAck = chatSocket.on("message_ack", ({ payload, messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, _id: payload.id, status: payload.status }
            : msg
        )
      );
    });

    const unsubStatus = chatSocket.on("message_status_update", ({ payload }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === payload.id ? { ...msg, status: payload.status } : msg
        )
      );
    });

    const unsubTypingStart = chatSocket.on("typing_start", ({ payload }) => {
      if (selectedRoom && payload.roomId === selectedRoom._id) {
        setPartnerTyping(true);
      }
    });

    const unsubTypingStop = chatSocket.on("typing_stop", ({ payload }) => {
      if (selectedRoom && payload.roomId === selectedRoom._id) {
        setPartnerTyping(false);
      }
    });

    // Real-time presence events
    const unsubUserOnline = chatSocket.on("user_online", ({ payload }) => {
      if (payload?.userId) setUserOnline(payload.userId);
    });
    const unsubUserOffline = chatSocket.on("user_offline", ({ payload }) => {
      if (payload?.userId) setUserOffline(payload.userId, payload.lastSeen || null);
    });
    // WS-based online status response (query result)
    const unsubOnlineStatusResp = chatSocket.on("online_status_response", ({ payload }) => {
      if (payload?.userId) {
        if (payload.isOnline) setUserOnline(payload.userId);
        else setUserOffline(payload.userId, payload.lastSeen || null);
      }
    });

    return () => {
      unsubNewMsg();
      unsubAck();
      unsubStatus();
      unsubTypingStart();
      unsubTypingStop();
      unsubUserOnline();
      unsubUserOffline();
      unsubOnlineStatusResp();
    };
  }, [selectedRoom?._id]);


  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getPartnerId = (room: any) => {
    if (!room) return "";
    const isParentRole = currentUserRole === "parent";
    return isParentRole ? room.teacherUserId?.toString() : room.parentUserId?.toString();
  };

  const getPartnerDisplayInfo = (room: any): ContactInfo => {
    const partnerId = getPartnerId(room);
    const cached = contactsMap.get(partnerId);

    if (cached) {
      return cached;
    }

    const fallbackName = isParent
      ? `Teacher (${partnerId || "Faculty"})`
      : `Parent (${partnerId || "Contact"})`;

    return {
      id: partnerId,
      name: fallbackName,
      info: isParent ? "Teacher Contact" : "Parent Contact",
      role: isParent ? "Teacher" : "Parent",
    };
  };

  // ----------------------------------------------------
  // 5. Send Message, Attachment Upload & Decrypted Download
  // ----------------------------------------------------
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;

    const textToSend = inputText.trim();
    setInputText("");
    const partnerId = getPartnerId(selectedRoom);
    let sharedKey = await getSharedKeyForPartner(partnerId);

    if (!sharedKey) {
      // Partner hasn't registered E2EE keys yet — show a pending message and retry for up to 30s
      const tempId = `pending_${Date.now()}`;
      const pendingMsg: DecryptedMessage = {
        _id: tempId,
        roomId: selectedRoom._id,
        senderId: currentUserId,
        senderRole: currentUserRole,
        recipientId: partnerId,
        text: textToSend,
        status: "sent",
        messageType: "text",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, pendingMsg]);
      scrollToBottom();

      // Retry key fetch for up to 30 seconds (recipient may be loading)
      let retries = 0;
      const maxRetries = 6;
      const retryInterval = setInterval(async () => {
        retries++;
        sharedKeyCacheRef.current.delete(partnerId); // clear cache to force re-fetch
        sharedKey = await getSharedKeyForPartner(partnerId);
        if (sharedKey) {
          clearInterval(retryInterval);
          try {
            const encryptedPayload = await encryptText(textToSend, sharedKey);
            chatSocket.sendEncryptedMessage({
              roomId: selectedRoom._id,
              recipientId: partnerId,
              encryptedPayload,
              messageType: "text",
            });
          } catch (err) {
            console.error("❌ Send after key-retry error:", err);
          }
        } else if (retries >= maxRetries) {
          clearInterval(retryInterval);
          // Remove the pending message if key never arrived
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          console.warn("⚠️ Recipient E2EE keys unavailable after retries. Message not sent.");
        }
      }, 5000);
      return;
    }

    try {
      const encryptedPayload = await encryptText(textToSend, sharedKey);
      const tempId = `temp_${Date.now()}`;

      const optimisticMsg: DecryptedMessage = {
        _id: tempId,
        roomId: selectedRoom._id,
        senderId: currentUserId,
        senderRole: currentUserRole,
        recipientId: partnerId,
        text: textToSend,
        status: "sent",
        messageType: "text",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      scrollToBottom();

      chatSocket.sendEncryptedMessage({
        roomId: selectedRoom._id,
        recipientId: partnerId,
        encryptedPayload,
        messageType: "text",
      });

      handleTypingStop();
    } catch (err) {
      console.error("❌ Send message error:", err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;

    const partnerId = getPartnerId(selectedRoom);
    const sharedKey = await getSharedKeyForPartner(partnerId);

    if (!sharedKey) {
      alert("Recipient public key missing. Cannot encrypt file attachment.");
      return;
    }

    setUploadingFile(true);
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const { encryptedBuffer, ivBase64 } = await encryptFileBuffer(fileArrayBuffer, sharedKey);
      const encryptedBlob = new Blob([encryptedBuffer], { type: "application/octet-stream" });

      const res = await chatApi.uploadAttachment(selectedRoom._id, encryptedBlob, file.name, ivBase64);
      if (res.success && res.data) {
        const metadataText = `📎 Attached file: ${file.name}`;
        const encryptedPayload = await encryptText(metadataText, sharedKey);

        chatSocket.sendEncryptedMessage({
          roomId: selectedRoom._id,
          recipientId: partnerId,
          encryptedPayload,
          messageType: "attachment",
          attachmentId: res.data._id,
        });

        loadRoomMessages(selectedRoom._id, partnerId);
      }
    } catch (err) {
      console.error("❌ File encryption/upload error:", err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = async (msg: DecryptedMessage) => {
    if (!msg.attachmentUrl || !selectedRoom) return;
    setDownloadingFileId(msg._id);

    try {
      const partnerId = getPartnerId(selectedRoom);
      const sharedKey = await getSharedKeyForPartner(partnerId);

      if (!sharedKey) {
        alert("Encryption key unavailable to decrypt attachment.");
        return;
      }

      const rawBaseUrl = import.meta.env.VITE_CHAT_API_URL || "http://localhost:5007";
      const normalizedBase = rawBaseUrl.startsWith("http://") || rawBaseUrl.startsWith("https://")
        ? rawBaseUrl
        : `https://${rawBaseUrl}`;
      const chatBaseUrl = normalizedBase.endsWith("/") ? normalizedBase.slice(0, -1) : normalizedBase;
      const fullUrl = msg.attachmentUrl.startsWith("http")
        ? msg.attachmentUrl
        : `${chatBaseUrl}${msg.attachmentUrl}`;

      const token = TokenService.getToken();
      const response = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`File fetch failed with status ${response.status}`);
      }

      const encryptedArrayBuffer = await response.arrayBuffer();
      if (!msg.attachmentIv) {
        alert("Attachment IV parameter missing.");
        return;
      }

      const decryptedArrayBuffer = await decryptFileBuffer(
        encryptedArrayBuffer,
        msg.attachmentIv,
        sharedKey
      );

      const blob = new Blob([decryptedArrayBuffer]);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = msg.attachmentName || "decrypted_attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("❌ Attachment download/decrypt error:", err);
      alert("Failed to download or decrypt attachment.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!selectedRoom) return;
    const partnerId = getPartnerId(selectedRoom);

    if (!isTyping) {
      setIsTyping(true);
      chatSocket.sendTypingStart(selectedRoom._id, partnerId);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  };

  const handleTypingStop = () => {
    if (isTyping && selectedRoom) {
      setIsTyping(false);
      const partnerId = getPartnerId(selectedRoom);
      chatSocket.sendTypingStop(selectedRoom._id, partnerId);
    }
  };

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter((r) => {
      const info = getPartnerDisplayInfo(r);
      return info.name.toLowerCase().includes(q) || info.info.toLowerCase().includes(q);
    });
  }, [rooms, searchQuery, contactsMap]);

  const activePartnerInfo = useMemo(() => {
    if (!selectedRoom) return null;
    return getPartnerDisplayInfo(selectedRoom);
  }, [selectedRoom, contactsMap]);

  return (
    <Box
      sx={{
        height: "calc(100vh - 84px)",
        p: { xs: 0, sm: 2 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* Main Container Shell */}
      {/* ---------------------------------------------------- */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          maxWidth: "1640px",
          maxHeight: { xs: "100%", md: "862px" },
          bgcolor: "#ffffff",
          borderRadius: { xs: 0, sm: "32px" },
          boxShadow: { xs: "none", sm: "0 25px 50px -12px rgba(0, 0, 0, 0.12)" },
          display: "flex",
          overflow: "hidden",
          border: { xs: "none", sm: "1px solid #e2e8f0" },
          position: "relative",
        }}
      >
        {/* ---------------------------------------------------- */}
        {/* Sidebar / Mobile Conversations View */}
        {/* ---------------------------------------------------- */}
        <Box
          sx={{
            width: { xs: "100%", md: "340px" },
            display: { xs: selectedRoom ? "none" : "flex", md: "flex" },
            flexDirection: "column",
            p: { xs: 2.5, sm: 3 },
            gap: 2,
            borderRight: "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Mobile/Desktop Sidebar Top Bar Header (Matches Mobile Screenshot 1) */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: { xs: 0.5, sm: 0 } }}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ fontSize: "1.25rem", letterSpacing: "-0.025em" }}>
                Chats
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                <LockIcon sx={{ fontSize: 11, color: "#4f46e5" }} />
                <Typography variant="caption" fontWeight={700} color="#4f46e5" sx={{ fontSize: "10px", tracking: "0.05em" }}>
                  E2E ENCRYPTED
                </Typography>
              </Stack>
            </Box>

            {/* <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#4f46e5",
                color: "#ffffff",
                boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)",
              }}
            >
              <PersonIcon sx={{ fontSize: 20 }} />
            </Avatar> */}
          </Stack>

          {/* Search Bar */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                bgcolor: "#ffffff",
                fontSize: "0.875rem",
                border: "1px solid #e2e8f0",
                "& fieldset": { border: "none" },
                "&:hover fieldset": { border: "none" },
                "&.Mui-focused fieldset": { border: "1px solid #6366f1" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Navigation Tabs ("Chats" vs "Directory") */}
          <Box
            sx={{
              bgcolor: "rgba(226, 232, 240, 0.6)",
              p: 0.5,
              borderRadius: "16px",
              display: "flex",
            }}
          >
            <Button
              fullWidth
              onClick={() => setActiveTab(0)}
              sx={{
                py: 0.85,
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: "12px",
                textTransform: "none",
                transition: "all 0.2s ease",
                bgcolor: activeTab === 0 ? "#ffffff" : "transparent",
                color: activeTab === 0 ? "#4f46e5" : "#64748b",
                boxShadow: activeTab === 0 ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : "none",
                "&:hover": {
                  bgcolor: activeTab === 0 ? "#ffffff" : "transparent",
                  color: activeTab === 0 ? "#4f46e5" : "#334155",
                },
              }}
            >
              Chats
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveTab(1)}
              sx={{
                py: 0.85,
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: "12px",
                textTransform: "none",
                transition: "all 0.2s ease",
                bgcolor: activeTab === 1 ? "#ffffff" : "transparent",
                color: activeTab === 1 ? "#4f46e5" : "#64748b",
                boxShadow: activeTab === 1 ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : "none",
                "&:hover": {
                  bgcolor: activeTab === 1 ? "#ffffff" : "transparent",
                  color: activeTab === 1 ? "#4f46e5" : "#334155",
                },
              }}
            >
              Directory
            </Button>
          </Box>

          {/* Conversation List Surface */}
          <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {activeTab === 0 && (
              isLoadingRooms ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "#4f46e5" }} />
                </Box>
              ) : filteredRooms.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center", color: "#64748b" }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    No conversations found.
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setActiveTab(1)}
                    sx={{ color: "#4f46e5", textTransform: "none", fontWeight: 700 }}
                  >
                    Open Directory
                  </Button>
                </Box>
              ) : (
                filteredRooms.map((room) => {
                  const isSelected = selectedRoom?._id === room._id;
                  const unread = isSelected
                    ? 0
                    : isParent
                      ? room.unreadCountParent
                      : room.unreadCountTeacher;
                  const displayInfo = getPartnerDisplayInfo(room);

                  return (
                    <Box
                      key={room._id}
                      onClick={() => setSelectedRoom(room)}
                      sx={{
                        p: 1.75,
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        bgcolor: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                        border: isSelected ? "2px solid #6366f1" : "1px solid #e2e8f0",
                        boxShadow: isSelected ? "0 4px 14px rgba(99, 102, 241, 0.15)" : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#6366f1",
                          bgcolor: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      {/* Avatar with real online/offline indicator */}
                      {(() => {
                        const partnerId = getPartnerId(room);
                        const presence = getPartnerPresence(partnerId);
                        return (
                          <Box sx={{ position: "relative", flexShrink: 0 }}>
                            <Avatar
                              src={displayInfo.profileImage || undefined}
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: "16px",
                                bgcolor: "#4f46e5",
                                fontWeight: 700,
                                fontSize: "1.125rem",
                              }}
                            >
                              {displayInfo.name.charAt(0)}
                            </Avatar>
                            {/* Online dot (green) or offline mark (grey x) */}
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                bgcolor: presence.isOnline ? "#10b981" : "#94a3b8",
                                border: "2px solid #ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {!presence.isOnline && (
                                <Box
                                  component="span"
                                  sx={{
                                    width: 6,
                                    height: 1.5,
                                    bgcolor: "#ffffff",
                                    borderRadius: "1px",
                                    transform: "rotate(45deg)",
                                    display: "block",
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        );
                      })()}

                      <Box sx={{ ml: 1.75, flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" fontWeight={600} color="#0f172a" noWrap sx={{ fontSize: "0.875rem" }}>
                            {displayInfo.name}
                          </Typography>

                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            {room.lastMessageAt && (
                              <Typography variant="caption" color="#4f46e5" fontWeight={700} sx={{ fontSize: "10px" }}>
                                {formatSingleTime(room.lastMessageAt, timeFormat)}
                              </Typography>
                            )}

                            {unread > 0 && (
                              <Box
                                sx={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  bgcolor: "#4f46e5",
                                  color: "#ffffff",
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {unread}
                              </Box>
                            )}

                            <Tooltip title="View Contact Details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenInfoModal(getPartnerId(room), e);
                                }}
                                sx={{
                                  color: "#94a3b8",
                                  p: 0.25,
                                  "&:hover": { color: "#4f46e5" },
                                }}
                              >
                                <InfoIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Typography variant="caption" fontWeight={700} color="#0f172a" noWrap sx={{ display: "block", fontSize: "11px", mt: 0.25 }}>
                          {displayInfo.info}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )
            )}

            {/* TAB 1: DIRECTORY */}
            {activeTab === 1 && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={isTeacher ? "Search parent or student..." : "Search teacher or subject..."}
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "16px",
                      bgcolor: "#ffffff",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {isTeacher && teacherAssignedClasses.length > 0 && (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Filter by Class</InputLabel>
                    <Select
                      value={selectedClassId}
                      label="Filter by Class"
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      sx={{ borderRadius: "16px" }}
                    >
                      <MenuItem value="">All Assigned Classes</MenuItem>
                      {teacherAssignedClasses.map((cls) => (
                        <MenuItem key={cls.classId} value={cls.classId}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {isParent && myChildren.length > 1 && (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select Child</InputLabel>
                    <Select
                      value={selectedChildId}
                      label="Select Child"
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      sx={{ borderRadius: "16px" }}
                    >
                      {myChildren.map((child) => (
                        <MenuItem key={child.studentId} value={child.studentId}>
                          {child.firstName} {child.lastName} ({child.className || "Class"})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                  {isTeacher ? (
                    isLoadingParents ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} sx={{ color: "#4f46e5" }} />
                      </Box>
                    ) : parentDirectory.length === 0 ? (
                      <Typography variant="body2" color="#64748b" textAlign="center" sx={{ py: 3 }}>
                        No parents found.
                      </Typography>
                    ) : (
                      parentDirectory.map((parent) => (
                        <Card key={parent.parentId} variant="outlined" sx={{ borderRadius: "16px", "&:hover": { borderColor: "#4f46e5" } }}>
                          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar src={parent.profileImage || undefined} sx={{ width: 40, height: 40, bgcolor: "#4f46e5", fontWeight: 700 }}>
                                {parent.firstName?.charAt(0) || "P"}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight={600} noWrap color="#0f172a">
                                  {parent.firstName} {parent.lastName}
                                </Typography>
                                <Typography variant="caption" color="#64748b" noWrap sx={{ display: "block" }}>
                                  {parent.childrenNames?.join(", ") || "Parent"}
                                </Typography>
                              </Box>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStartChatWithPartner(parent.parentId)}
                                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, bgcolor: "#4f46e5" }}
                              >
                                Chat
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    )
                  ) : (
                    isLoadingTeachers ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} sx={{ color: "#4f46e5" }} />
                      </Box>
                    ) : filteredTeacherDirectory.length === 0 ? (
                      <Typography variant="body2" color="#64748b" textAlign="center" sx={{ py: 3 }}>
                        No teachers found.
                      </Typography>
                    ) : (
                      filteredTeacherDirectory.map((teacher) => (
                        <Card key={teacher.teacherId} variant="outlined" sx={{ borderRadius: "16px", "&:hover": { borderColor: "#4f46e5" } }}>
                          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar src={teacher.profileImage || undefined} sx={{ width: 40, height: 40, bgcolor: "#4f46e5", fontWeight: 700 }}>
                                {teacher.firstName?.charAt(0) || "T"}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight={600} noWrap color="#0f172a">
                                  {teacher.firstName} {teacher.lastName}
                                </Typography>
                                <Typography variant="caption" color="#64748b" noWrap sx={{ display: "block" }}>
                                  {teacher.subjectNames?.map(formatSubjectName).join(", ") || "Faculty"}
                                </Typography>
                              </Box>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStartChatWithPartner(teacher.teacherId, selectedChildId)}
                                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, bgcolor: "#4f46e5" }}
                              >
                                Chat
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    )
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Bottom Mobile E2EE Guard Footer (Matches Mobile Screenshot 1) */}
          <Box sx={{ pt: 2, textAlign: "center", pb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "#f1f5f9",
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1,
              }}
            >
              <ShieldIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ fontSize: "10px", tracking: "0.05em", display: "block" }}>
              END-TO-END ENCRYPTED
            </Typography>
            <Typography variant="caption" color="#cbd5e1" sx={{ fontSize: "11px" }}>
              Only you and your contacts can read these messages.
            </Typography>
          </Box>

          {/* Bottom Floating Action Button (FAB) (Matches Mobile Screenshot 1) */}
          <Fab
            onClick={() => setActiveTab(1)}
            sx={{
              position: "absolute",
              bottom: 24,
              right: 24,
              bgcolor: "#4f46e5",
              color: "#ffffff",
              boxShadow: "0 10px 20px rgba(79, 70, 229, 0.4)",
              "&:hover": { bgcolor: "#4338ca" },
            }}
          >
            <EditIcon />
          </Fab>
        </Box>

        {/* ---------------------------------------------------- */}
        {/* Chat Window / Mobile Message View */}
        {/* ---------------------------------------------------- */}
        <Box
          sx={{
            flex: 1,
            display: { xs: selectedRoom ? "flex" : "none", md: "flex" },
            flexDirection: "column",
            bgcolor: "#f5f7ff",
          }}
        >
          {selectedRoom ? (
            <>
              {/* Mobile Top Navigation Header Bar (Matches Mobile Screenshot 2) */}
              <Box
                sx={{
                  display: { xs: "flex", md: "none" },
                  height: "56px",
                  px: 2,
                  bgcolor: "#ffffff",
                  borderBottom: "1px solid #e2e8f0",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconButton onClick={() => setSelectedRoom(null)} sx={{ color: "#4f46e5", p: 0.5 }}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ fontSize: "1.125rem" }}>
                    Message View
                  </Typography>
                </Stack>

                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#4f46e5",
                    color: "#ffffff",
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              </Box>

              {/* Chat Header Bar */}
              <Box
                sx={{
                  height: { xs: "72px", md: "96px" },
                  px: { xs: 2, md: 5 },
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                {/* Avatar with real presence indicator */}
                {(() => {
                  const partnerId = getPartnerId(selectedRoom);
                  const presence = getPartnerPresence(partnerId);
                  return (
                    <Box sx={{ position: "relative", mr: 2, flexShrink: 0 }}>
                      <Avatar
                        src={activePartnerInfo?.profileImage || undefined}
                        sx={{
                          width: { xs: 44, md: 56 },
                          height: { xs: 44, md: 56 },
                          borderRadius: "16px",
                          bgcolor: "#4f46e5",
                          fontWeight: 700,
                          fontSize: "1.25rem",
                          boxShadow: "0 10px 20px -5px rgba(238, 242, 255, 1)",
                        }}
                      >
                        {activePartnerInfo?.name?.charAt(0) || "U"}
                      </Avatar>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: presence.isOnline ? "#10b981" : "#94a3b8",
                          border: "2px solid #ffffff",
                        }}
                      />
                    </Box>
                  );
                })()}

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ fontSize: { xs: "1rem", md: "1.125rem" } }}>
                    {activePartnerInfo?.name}
                  </Typography>

                  {partnerTyping ? (
                    <Typography variant="caption" color="#4f46e5" fontStyle="italic" fontWeight={600}>
                      typing...
                    </Typography>
                  ) : (() => {
                    const partnerId = getPartnerId(selectedRoom);
                    const presence = getPartnerPresence(partnerId);
                    if (presence.isOnline) {
                      return (
                        <Typography variant="caption" fontWeight={700} color="#10b981" sx={{ fontSize: "10px", letterSpacing: "0.05em", display: "block" }}>
                          ONLINE
                        </Typography>
                      );
                    } else if (presence.lastSeen) {
                      return (
                        <Typography variant="caption" fontWeight={500} color="#94a3b8" sx={{ fontSize: "10px", display: "block" }}>
                          Last seen {formatSingleTime(presence.lastSeen, timeFormat)}
                        </Typography>
                      );
                    } else {
                      return (
                        <Typography variant="caption" fontWeight={500} color="#cbd5e1" sx={{ fontSize: "10px", display: "block" }}>
                          Offline
                        </Typography>
                      );
                    }
                  })()}
                </Box>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenInfoModal(getPartnerId(selectedRoom), e)}
                    sx={{ p: 1, color: "#94a3b8", "&:hover": { bgcolor: "#f1f5f9", color: "#334155" } }}
                  >
                    <InfoIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Stack>
              </Box>

              {/* Message Viewport */}
              <Box
                ref={viewportRef}
                onScroll={handleViewportScroll}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: { xs: 2, md: 5 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                  "&::-webkit-scrollbar": { width: "5px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": { background: "#e2e8f0", borderRadius: "10px" },
                }}
              >
                {/* Infinite Scroll Up Loader */}
                {isLoadingMore && (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                    <CircularProgress size={22} sx={{ color: "#4f46e5" }} />
                  </Box>
                )}

                {/* Discrete Encryption Notice */}
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      bgcolor: "rgba(241, 245, 249, 0.8)",
                      border: "1px solid rgba(226, 232, 240, 0.5)",
                      borderRadius: "16px",
                      px: 3,
                      py: 1.25,
                      maxWidth: "440px",
                      textAlign: "center",
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                      <LockIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                      <Typography variant="caption" fontWeight={500} color="#64748b" sx={{ fontSize: "11px" }}>
                        Messages are end-to-end encrypted
                      </Typography>
                    </Stack>
                  </Box>
                </Box>

                {/* Messages grouped by date with dynamic dividers */}
                {isLoadingMessages ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#4f46e5" }} />
                  </Box>
                ) : (() => {
                  // Helper: get YYYY-MM-DD local date string from ISO timestamp
                  const getLocalDateStr = (iso: string) => {
                    const d = new Date(iso);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  };

                  const todayStr = getLocalDateStr(new Date().toISOString());
                  const yesterdayStr = getLocalDateStr(new Date(Date.now() - 86400000).toISOString());

                  const getDateLabel = (iso: string) => {
                    const dateStr = getLocalDateStr(iso);
                    if (dateStr === todayStr) return "TODAY";
                    if (dateStr === yesterdayStr) return "YESTERDAY";
                    const d = new Date(iso);
                    return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
                  };

                  let lastDateStr = "";
                  const elements: React.ReactNode[] = [];

                  messages.forEach((msg) => {
                    const msgDateStr = getLocalDateStr(msg.createdAt);
                    if (msgDateStr !== lastDateStr) {
                      lastDateStr = msgDateStr;
                      elements.push(
                        <Box key={`divider-${msgDateStr}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 1.5 }}>
                          <Box sx={{ flex: 1, height: "1px", bgcolor: "#e2e8f0" }} />
                          <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ fontSize: "10px", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                            {getDateLabel(msg.createdAt)}
                          </Typography>
                          <Box sx={{ flex: 1, height: "1px", bgcolor: "#e2e8f0" }} />
                        </Box>
                      );
                    }

                    const isOwn = msg.senderId.toString() === currentUserId;
                    const isAttachment = msg.messageType === "attachment" || !!msg.attachmentUrl;

                    elements.push(

                      <Box
                        key={msg._id}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isOwn ? "flex-end" : "flex-start",
                        }}
                      >
                        {isAttachment ? (
                          // FILE BUBBLE
                          isOwn ? (
                            // OUTGOING ATTACHMENT BUBBLE (Right-aligned, Indigo theme, with ticks)
                            <Box
                              sx={{
                                p: 0.5,
                                boxShadow: "0 10px 20px -3px rgba(79, 70, 229, 0.3)",
                                width: "100%",
                                maxWidth: "440px",
                                background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                                borderRadius: "16px 16px 2px 16px",
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor: "rgba(255, 255, 255, 0.05)",
                                  borderRadius: "15px",
                                  p: 1.75,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                                  <Box
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      bgcolor: "rgba(255, 255, 255, 0.15)",
                                      borderRadius: "12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backdropFilter: "blur(12px)",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <FileIcon sx={{ fontSize: 22 }} />
                                  </Box>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={600} color="#ffffff" noWrap sx={{ fontSize: "13px" }}>
                                      {msg.attachmentName || "attachment"}
                                    </Typography>
                                    <Typography variant="caption" color="rgba(224, 231, 255, 0.8)" fontWeight={700} sx={{ fontSize: "10px", display: "block" }}>
                                      DOCUMENT • END-TO-END ENCRYPTED
                                    </Typography>
                                  </Box>
                                </Stack>

                                <IconButton
                                  onClick={() => handleDownloadAttachment(msg)}
                                  disabled={downloadingFileId === msg._id}
                                  sx={{
                                    p: 1.25,
                                    bgcolor: "#ffffff",
                                    color: "#3730a3",
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                    "&:hover": { bgcolor: "#e0e7ff" },
                                  }}
                                >
                                  {downloadingFileId === msg._id ? (
                                    <CircularProgress size={18} color="inherit" />
                                  ) : (
                                    <DownloadIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Box>

                              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.75} sx={{ px: 2, py: 0.75 }}>
                                <Typography variant="caption" color="#e0e7ff" fontWeight={500} sx={{ fontSize: "10px" }}>
                                  {formatSingleTime(msg.createdAt, timeFormat)}
                                </Typography>
                                {msg.status === "read" ? (
                                  <DoneAllIcon sx={{ fontSize: 14, color: "#c7d2fe" }} />
                                ) : (
                                  <CheckIcon sx={{ fontSize: 14, color: "#c7d2fe" }} />
                                )}
                              </Stack>
                            </Box>
                          ) : (
                            // INCOMING ATTACHMENT BUBBLE (Left-aligned, White theme, NO ticks)
                            <Box
                              sx={{
                                p: 0.5,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                width: "100%",
                                maxWidth: "440px",
                                bgcolor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "16px 16px 16px 2px",
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor: "#f8fafc",
                                  borderRadius: "15px",
                                  p: 1.75,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                                  <Box
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      bgcolor: "#e0e7ff",
                                      borderRadius: "12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#4f46e5",
                                    }}
                                  >
                                    <FileIcon sx={{ fontSize: 22 }} />
                                  </Box>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a" noWrap sx={{ fontSize: "13px" }}>
                                      {msg.attachmentName || "attachment"}
                                    </Typography>
                                    <Typography variant="caption" color="#64748b" fontWeight={700} sx={{ fontSize: "10px", display: "block" }}>
                                      DOCUMENT • END-TO-END ENCRYPTED
                                    </Typography>
                                  </Box>
                                </Stack>

                                <IconButton
                                  onClick={() => handleDownloadAttachment(msg)}
                                  disabled={downloadingFileId === msg._id}
                                  sx={{
                                    p: 1.25,
                                    bgcolor: "#4f46e5",
                                    color: "#ffffff",
                                    borderRadius: "12px",
                                    boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
                                    "&:hover": { bgcolor: "#4338ca" },
                                  }}
                                >
                                  {downloadingFileId === msg._id ? (
                                    <CircularProgress size={18} color="inherit" />
                                  ) : (
                                    <DownloadIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Box>

                              <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={0.75} sx={{ px: 2, py: 0.75 }}>
                                <Typography variant="caption" color="#94a3b8" fontWeight={500} sx={{ fontSize: "10px" }}>
                                  {formatSingleTime(msg.createdAt, timeFormat)}
                                </Typography>
                              </Stack>
                            </Box>
                          )
                        ) : isOwn ? (
                          // OUTGOING TEXT BUBBLE
                          <Box
                            sx={{
                              bgcolor: "#4f46e5",
                              color: "#ffffff",
                              px: 2.5,
                              py: 1.5,
                              maxWidth: "85%",
                              borderRadius: "12px 12px 2px 12px",
                              boxShadow: "0 10px 15px -3px rgba(199, 210, 254, 0.5)",
                            }}
                          >
                            <Typography variant="body1" sx={{ fontSize: "15px", lineHeight: "1.6" }}>
                              {msg.text}
                            </Typography>
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.75} sx={{ mt: 0.75 }}>
                              <Typography variant="caption" color="#e0e7ff" fontWeight={500} sx={{ fontSize: "10px" }}>
                                {formatSingleTime(msg.createdAt, timeFormat)}
                              </Typography>
                              {msg.status === "read" ? (
                                <DoneAllIcon sx={{ fontSize: 14, color: "#c7d2fe" }} />
                              ) : (
                                <CheckIcon sx={{ fontSize: 14, color: "#c7d2fe" }} />
                              )}
                            </Stack>
                          </Box>
                        ) : (
                          // INCOMING TEXT BUBBLE
                          <Box
                            sx={{
                              bgcolor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              color: "#0f172a",
                              px: 2.5,
                              py: 1.5,
                              maxWidth: "85%",
                              borderRadius: "12px 12px 12px 2px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            }}
                          >
                            <Typography variant="body1" sx={{ fontSize: "15px", lineHeight: "1.6" }}>
                              {msg.text}
                            </Typography>
                            <Typography variant="caption" color="#94a3b8" fontWeight={500} sx={{ fontSize: "10px", display: "block", mt: 0.75 }}>
                              {formatSingleTime(msg.createdAt, timeFormat)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ); // end elements.push
                  }); // end messages.forEach

                  return elements;
                })()}
                <div ref={messagesEndRef} />
              </Box>

              {/* Chat Input Bar Footer */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  px: { xs: 2, md: 5 },
                  py: { xs: 2, md: 3 },
                  bgcolor: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />

                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  sx={{
                    p: 1.25,
                    color: "#94a3b8",
                    borderRadius: "16px",
                    transition: "all 0.2s ease",
                    "&:hover": { color: "#4f46e5", bgcolor: "#e0e7ff" },
                  }}
                >
                  {uploadingFile ? <CircularProgress size={20} sx={{ color: "#4f46e5" }} /> : <AttachFileIcon sx={{ fontSize: 22 }} />}
                </IconButton>

                <Box sx={{ flex: 1, display: "flex", alignItems: "center", bgcolor: "#f8fafc", borderRadius: "9999px", px: 2, border: "1px solid #e2e8f0" }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Type a secure message..."
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      sx: { py: 1, fontSize: "15px" },
                    }}
                  />
                  <IconButton size="small" sx={{ color: "#94a3b8" }}>
                    <EmojiIcon fontSize="small" />
                  </IconButton>
                </Box>

                <IconButton
                  type="submit"
                  disabled={!inputText.trim()}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: "#4f46e5",
                    color: "#ffffff",
                    borderRadius: "50%",
                    boxShadow: "0 10px 15px -3px rgba(199, 210, 254, 1)",
                    transition: "all 0.2s ease",
                    "&:hover": { bgcolor: "#4338ca", transform: "scale(1.05)" },
                    "&:active": { transform: "scale(0.95)" },
                    "&.Mui-disabled": { bgcolor: "#e2e8f0", color: "#94a3b8", boxShadow: "none" },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18, ml: 0.25 }} />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                bgcolor: "#f8fafc",
                color: "#64748b",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "#e0e7ff",
                  color: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  boxShadow: "0 10px 20px -5px rgba(199, 210, 254, 0.8)",
                }}
              >
                <LockIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                End-to-End Encrypted Secure Chat
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ maxWidth: 360, mt: 1, color: "#64748b" }}>
                Select a conversation from the sidebar or click <strong>Directory</strong> to search {isTeacher ? "parents" : "teachers"}.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ---------------------------------------------------- */}
      {/* CONTACT DETAILS POPUP DIALOG */}
      {/* ---------------------------------------------------- */}
      <Dialog
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 250 }}
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 1,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoIcon sx={{ color: "#4f46e5" }} />
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Contact Details
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setInfoModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, borderColor: "#f1f5f9" }}>
          {selectedContactInfo && (
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={selectedContactInfo.profileImage || undefined}
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: "16px",
                    bgcolor: "#4f46e5",
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {selectedContactInfo.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {selectedContactInfo.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedContactInfo.role}
                      sx={{ fontWeight: 700, bgcolor: "#e0e7ff", color: "#3730a3" }}
                      size="small"
                    />
                    {selectedContactInfo.relationship && (
                      <Chip
                        label={selectedContactInfo.relationship}
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: "capitalize", fontWeight: 600 }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700} color="#475569">
                  Contact Information
                </Typography>

                {selectedContactInfo.email && (
                  <Box sx={{ p: 1.5, borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f8fafc" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <EmailIcon fontSize="small" sx={{ color: "#4f46e5" }} />
                      <Typography variant="body2" fontWeight={600} color="#0f172a">
                        {selectedContactInfo.email}
                      </Typography>
                    </Stack>
                    <Tooltip title={copiedField === "email" ? "Copied!" : "Copy Email"}>
                      <IconButton size="small" onClick={() => handleCopyField(selectedContactInfo.email!, "email")}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {selectedContactInfo.phone && (
                  <Box sx={{ p: 1.5, borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f8fafc" }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <PhoneIcon fontSize="small" sx={{ color: "#4f46e5" }} />
                      <Typography variant="body2" fontWeight={600} color="#0f172a">
                        {selectedContactInfo.phone}
                      </Typography>
                    </Stack>
                    <Tooltip title={copiedField === "phone" ? "Copied!" : "Copy Phone"}>
                      <IconButton size="small" onClick={() => handleCopyField(selectedContactInfo.phone!, "phone")}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Stack>

              {selectedContactInfo.subjects && selectedContactInfo.subjects.length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569">
                    Subjects Taught
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {selectedContactInfo.subjects.map((sub, idx) => (
                      <Chip key={idx} label={formatSubjectName(sub)} size="small" sx={{ fontWeight: 700, bgcolor: "#e0e7ff", color: "#3730a3" }} />
                    ))}
                  </Stack>
                </Stack>
              )}

              {selectedContactInfo.childrenDetails && selectedContactInfo.childrenDetails.length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700} color="#475569">
                    {isParent ? "Taught Children" : "Enrolled Children"}
                  </Typography>
                  <Stack spacing={1}>
                    {selectedContactInfo.childrenDetails.map((child, idx) => (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: "12px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1.5 }}>
                        <ChildIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#0f172a">
                            {child.name}
                          </Typography>
                          {child.classSection && (
                            <Typography variant="caption" color="#64748b" fontWeight={600}>
                              {formatClassSectionName(child.classSection)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.75 }}>
          <Button variant="outlined" onClick={() => setInfoModalOpen(false)} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, color: "#64748b", borderColor: "#cbd5e1" }}>
            Close
          </Button>
          {selectedContactInfo && (
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => {
                setInfoModalOpen(false);
                handleStartChatWithPartner(selectedContactInfo.id);
              }}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 700, bgcolor: "#4f46e5" }}
            >
              Message Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatPage;
