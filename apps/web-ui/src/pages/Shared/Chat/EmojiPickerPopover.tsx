import React, { useState, useMemo } from 'react';
import {
  Popover,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  SentimentSatisfiedAlt as SmileIcon,
  PanTool as HandIcon,
  School as SchoolIcon,
  Celebration as PartyIcon,
  Favorite as HeartIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface EmojiItem {
  emoji: string;
  name: string;
  category: number; // 0: Smileys, 1: Gestures, 2: School, 3: Celebration, 4: Symbols
  keywords: string[];
}

const EMOJI_DATABASE: EmojiItem[] = [
  // 0: Smileys & Emotions
  { emoji: '😀', name: 'Grinning', category: 0, keywords: ['happy', 'smile', 'grin'] },
  { emoji: '😃', name: 'Big Smile', category: 0, keywords: ['happy', 'joy'] },
  { emoji: '😄', name: 'Laugh Smile', category: 0, keywords: ['happy', 'laugh'] },
  { emoji: '😁', name: 'Beaming', category: 0, keywords: ['grin', 'smile'] },
  { emoji: '😆', name: 'Squint Laugh', category: 0, keywords: ['haha', 'laugh'] },
  { emoji: '😅', name: 'Sweat Smile', category: 0, keywords: ['hot', 'phew'] },
  { emoji: '😂', name: 'Joy Tears', category: 0, keywords: ['funny', 'laugh', 'crying'] },
  { emoji: '🤣', name: 'ROFL', category: 0, keywords: ['rolling', 'floor', 'laugh'] },
  { emoji: '😊', name: 'Warm Smile', category: 0, keywords: ['happy', 'blush'] },
  { emoji: '😇', name: 'Angel', category: 0, keywords: ['halo', 'innocent'] },
  { emoji: '🙂', name: 'Slight Smile', category: 0, keywords: ['smile', 'content'] },
  { emoji: '🙃', name: 'Upside Down', category: 0, keywords: ['sarcastic', 'silly'] },
  { emoji: '😉', name: 'Wink', category: 0, keywords: ['flirt', 'joke'] },
  { emoji: '😌', name: 'Relieved', category: 0, keywords: ['calm', 'peace'] },
  { emoji: '😍', name: 'Heart Eyes', category: 0, keywords: ['love', 'crush', 'heart'] },
  { emoji: '🥰', name: 'Smiling Hearts', category: 0, keywords: ['love', 'adore'] },
  { emoji: '😘', name: 'Blow Kiss', category: 0, keywords: ['kiss', 'love'] },
  { emoji: '😋', name: 'Yum', category: 0, keywords: ['delicious', 'food', 'taste'] },
  { emoji: '😛', name: 'Tongue', category: 0, keywords: ['silly', 'playful'] },
  { emoji: '😜', name: 'Wink Tongue', category: 0, keywords: ['crazy', 'joke'] },
  { emoji: '🤪', name: 'Zany', category: 0, keywords: ['goofy', 'wild'] },
  { emoji: '🤨', name: 'Raised Eyebrow', category: 0, keywords: ['skeptical', 'doubt'] },
  { emoji: '🧐', name: 'Monocle', category: 0, keywords: ['curious', 'examine'] },
  { emoji: '🤓', name: 'Nerd', category: 0, keywords: ['smart', 'glasses', 'study'] },
  { emoji: '😎', name: 'Cool', category: 0, keywords: ['sunglasses', 'awesome'] },
  { emoji: '🤩', name: 'Star Struck', category: 0, keywords: ['excited', 'wow', 'star'] },
  { emoji: '🥳', name: 'Party', category: 0, keywords: ['celebrate', 'birthday', 'horn'] },
  { emoji: '😏', name: 'Smirk', category: 0, keywords: ['cheeky', 'flirt'] },
  { emoji: '😒', name: 'Unamused', category: 0, keywords: ['meh', 'annoyed'] },
  { emoji: '😞', name: 'Disappointed', category: 0, keywords: ['sad', 'bad'] },
  { emoji: '😔', name: 'Pensive', category: 0, keywords: ['thoughtful', 'sad'] },
  { emoji: '😟', name: 'Worried', category: 0, keywords: ['nervous', 'concern'] },
  { emoji: '😕', name: 'Confused', category: 0, keywords: ['what', 'huh'] },
  { emoji: '🥺', name: 'Pleading', category: 0, keywords: ['puppy', 'please', 'beg'] },
  { emoji: '😢', name: 'Crying', category: 0, keywords: ['sad', 'tear'] },
  { emoji: '😭', name: 'Sobbing', category: 0, keywords: ['bawling', 'sad', 'crying'] },
  { emoji: '😤', name: 'Triumph', category: 0, keywords: ['proud', 'steam'] },
  { emoji: '😠', name: 'Angry', category: 0, keywords: ['mad', 'grr'] },
  { emoji: '😡', name: 'Rage', category: 0, keywords: ['furious', 'red'] },
  { emoji: '🤬', name: 'Cursing', category: 0, keywords: ['swear', 'angry'] },
  { emoji: '🤯', name: 'Mind Blown', category: 0, keywords: ['exploding', 'shocked'] },
  { emoji: '😳', name: 'Flushed', category: 0, keywords: ['embarrassed', 'shy'] },
  { emoji: '🥵', name: 'Hot', category: 0, keywords: ['sweating', 'heat'] },
  { emoji: '🥶', name: 'Cold', category: 0, keywords: ['freezing', 'ice'] },
  { emoji: '😱', name: 'Scream', category: 0, keywords: ['shocked', 'fear', 'omg'] },
  { emoji: '🤗', name: 'Hugs', category: 0, keywords: ['care', 'welcome'] },
  { emoji: '🤔', name: 'Thinking', category: 0, keywords: ['wonder', 'idea', 'hmmm'] },
  { emoji: '🤫', name: 'Quiet', category: 0, keywords: ['shh', 'secret', 'silence'] },
  { emoji: '😴', name: 'Sleeping', category: 0, keywords: ['tired', 'night', 'zzz'] },
  { emoji: '🤤', name: 'Drooling', category: 0, keywords: ['tasty', 'delicious'] },

  // 1: Gestures & Hands
  { emoji: '👋', name: 'Wave', category: 1, keywords: ['hello', 'hi', 'bye', 'hand'] },
  { emoji: '🤚', name: 'Raised Back Hand', category: 1, keywords: ['hand', 'stop'] },
  { emoji: '✋', name: 'Raised Hand', category: 1, keywords: ['stop', 'high five', 'ask'] },
  { emoji: '👌', name: 'OK Hand', category: 1, keywords: ['perfect', 'good', 'agree'] },
  { emoji: '🤌', name: 'Pinched Fingers', category: 1, keywords: ['italian', 'what'] },
  { emoji: '🤏', name: 'Pinching Hand', category: 1, keywords: ['little', 'small'] },
  { emoji: '✌️', name: 'Peace', category: 1, keywords: ['victory', 'two', 'peace'] },
  { emoji: '🤞', name: 'Fingers Crossed', category: 1, keywords: ['luck', 'hope'] },
  { emoji: '🫰', name: 'Hand Heart', category: 1, keywords: ['love', 'kpop', 'money'] },
  { emoji: '🤟', name: 'Love You', category: 1, keywords: ['sign', 'love'] },
  { emoji: '🤘', name: 'Rock On', category: 1, keywords: ['rock', 'party'] },
  { emoji: '🤙', name: 'Call Me', category: 1, keywords: ['phone', 'shaka'] },
  { emoji: '👈', name: 'Point Left', category: 1, keywords: ['direction', 'left'] },
  { emoji: '👉', name: 'Point Right', category: 1, keywords: ['direction', 'right'] },
  { emoji: '👆', name: 'Point Up', category: 1, keywords: ['direction', 'above'] },
  { emoji: '👇', name: 'Point Down', category: 1, keywords: ['direction', 'below'] },
  { emoji: '👍', name: 'Thumbs Up', category: 1, keywords: ['like', 'approve', 'yes', 'good'] },
  { emoji: '👎', name: 'Thumbs Down', category: 1, keywords: ['dislike', 'no', 'bad'] },
  { emoji: '✊', name: 'Raised Fist', category: 1, keywords: ['power', 'solidarity'] },
  { emoji: '👊', name: 'Fist Bump', category: 1, keywords: ['punch', 'bro'] },
  { emoji: '👏', name: 'Clapping', category: 1, keywords: ['applause', 'praise', 'bravo'] },
  { emoji: '🙌', name: 'Raising Hands', category: 1, keywords: ['celebrate', 'hooray'] },
  { emoji: '👐', name: 'Open Hands', category: 1, keywords: ['hug', 'open'] },
  { emoji: '🤲', name: 'Palms Together', category: 1, keywords: ['prayer', 'dua'] },
  { emoji: '🤝', name: 'Handshake', category: 1, keywords: ['deal', 'agreement', 'meet'] },
  { emoji: '🙏', name: 'Folded Hands', category: 1, keywords: ['please', 'thank you', 'namaste', 'pray'] },
  { emoji: '✍️', name: 'Writing Hand', category: 1, keywords: ['write', 'homework', 'pen'] },
  { emoji: '💪', name: 'Flexed Biceps', category: 1, keywords: ['strong', 'muscle', 'workout', 'power'] },
  { emoji: '👀', name: 'Eyes', category: 1, keywords: ['look', 'see', 'watch'] },

  // 2: School & Education
  { emoji: '📚', name: 'Books', category: 2, keywords: ['reading', 'library', 'study', 'education'] },
  { emoji: '📖', name: 'Open Book', category: 2, keywords: ['read', 'study', 'lesson'] },
  { emoji: '📕', name: 'Closed Book', category: 2, keywords: ['textbook', 'red book'] },
  { emoji: '📗', name: 'Green Book', category: 2, keywords: ['textbook'] },
  { emoji: '📘', name: 'Blue Book', category: 2, keywords: ['textbook'] },
  { emoji: '📙', name: 'Orange Book', category: 2, keywords: ['textbook'] },
  { emoji: '📓', name: 'Notebook', category: 2, keywords: ['notes', 'journal'] },
  { emoji: '📒', name: 'Ledger', category: 2, keywords: ['spiral', 'notes'] },
  { emoji: '📃', name: 'Page Curl', category: 2, keywords: ['document', 'assignment'] },
  { emoji: '📄', name: 'Page Facing Up', category: 2, keywords: ['paper', 'document'] },
  { emoji: '📝', name: 'Memo', category: 2, keywords: ['note', 'exam', 'test', 'write'] },
  { emoji: '✏️', name: 'Pencil', category: 2, keywords: ['write', 'draw', 'stationery'] },
  { emoji: '🖊️', name: 'Pen', category: 2, keywords: ['ballpoint', 'write'] },
  { emoji: '🖌️', name: 'Paintbrush', category: 2, keywords: ['art', 'color'] },
  { emoji: '🖍️', name: 'Crayon', category: 2, keywords: ['draw', 'kids'] },
  { emoji: '📐', name: 'Triangular Ruler', category: 2, keywords: ['math', 'geometry', 'measure'] },
  { emoji: '📏', name: 'Straight Ruler', category: 2, keywords: ['math', 'measure'] },
  { emoji: '✂️', name: 'Scissors', category: 2, keywords: ['cut', 'craft'] },
  { emoji: '💼', name: 'Briefcase', category: 2, keywords: ['teacher', 'work', 'office'] },
  { emoji: '📁', name: 'File Folder', category: 2, keywords: ['files', 'directory'] },
  { emoji: '📅', name: 'Date Calendar', category: 2, keywords: ['schedule', 'timetable', 'date'] },
  { emoji: '📆', name: 'Calendar', category: 2, keywords: ['month', 'events'] },
  { emoji: '📊', name: 'Bar Chart', category: 2, keywords: ['grades', 'progress', 'results', 'stats'] },
  { emoji: '📈', name: 'Trending Up', category: 2, keywords: ['improvement', 'growth'] },
  { emoji: '📋', name: 'Clipboard', category: 2, keywords: ['attendance', 'checklist', 'tasks'] },
  { emoji: '📌', name: 'Pushpin', category: 2, keywords: ['important', 'notice', 'pin'] },
  { emoji: '📍', name: 'Round Pin', category: 2, keywords: ['location', 'map'] },
  { emoji: '📎', name: 'Paperclip', category: 2, keywords: ['attach', 'attachment', 'file'] },
  { emoji: '🎒', name: 'Backpack', category: 2, keywords: ['schoolbag', 'bag', 'student'] },
  { emoji: '🎓', name: 'Graduation Cap', category: 2, keywords: ['graduate', 'degree', 'academic'] },
  { emoji: '🏫', name: 'School', category: 2, keywords: ['building', 'campus', 'academy'] },
  { emoji: '💡', name: 'Lightbulb', category: 2, keywords: ['idea', 'creative', 'smart', 'bright'] },
  { emoji: '🔬', name: 'Microscope', category: 2, keywords: ['science', 'biology', 'lab'] },
  { emoji: '🧪', name: 'Test Tube', category: 2, keywords: ['chemistry', 'experiment'] },
  { emoji: '💻', name: 'Laptop', category: 2, keywords: ['computer', 'online', 'tech'] },
  { emoji: '📱', name: 'Mobile Phone', category: 2, keywords: ['sms', 'chat', 'call'] },
  { emoji: '⏰', name: 'Alarm Clock', category: 2, keywords: ['time', 'bell', 'morning', 'period'] },

  // 3: Celebration & Objects
  { emoji: '🎉', name: 'Party Popper', category: 3, keywords: ['celebrate', 'congrats', 'tada', 'yay'] },
  { emoji: '🎊', name: 'Confetti Ball', category: 3, keywords: ['celebration', 'festival'] },
  { emoji: '🎈', name: 'Balloon', category: 3, keywords: ['party', 'birthday'] },
  { emoji: '🎁', name: 'Gift', category: 3, keywords: ['present', 'reward'] },
  { emoji: '🏆', name: 'Trophy', category: 3, keywords: ['winner', 'champion', 'award', '1st'] },
  { emoji: '🥇', name: '1st Place Medal', category: 3, keywords: ['gold', 'first', 'winner'] },
  { emoji: '🥈', name: '2nd Place Medal', category: 3, keywords: ['silver', 'second'] },
  { emoji: '🥉', name: '3rd Place Medal', category: 3, keywords: ['bronze', 'third'] },
  { emoji: '⭐', name: 'Star', category: 3, keywords: ['favorite', 'good job', 'gold star'] },
  { emoji: '🌟', name: 'Glowing Star', category: 3, keywords: ['excellent', 'shining', 'brilliant'] },
  { emoji: '✨', name: 'Sparkles', category: 3, keywords: ['magic', 'clean', 'awesome'] },
  { emoji: '🔥', name: 'Fire', category: 3, keywords: ['lit', 'hot', 'streak'] },
  { emoji: '💯', name: 'Hundred Points', category: 3, keywords: ['perfect', 'score', '100%'] },
  { emoji: '🔔', name: 'Bell', category: 3, keywords: ['notification', 'alert', 'ring'] },
  { emoji: '📢', name: 'Loudspeaker', category: 3, keywords: ['announcement', 'broadcast'] },
  { emoji: '🎯', name: 'Bullseye Target', category: 3, keywords: ['goal', 'accurate', 'target'] },
  { emoji: '⚽', name: 'Soccer Ball', category: 3, keywords: ['football', 'sports'] },
  { emoji: '🏀', name: 'Basketball', category: 3, keywords: ['sports', 'ball'] },
  { emoji: '🏏', name: 'Cricket', category: 3, keywords: ['cricket', 'bat', 'sports'] },
  { emoji: '🏸', name: 'Badminton', category: 3, keywords: ['racket', 'sports'] },
  { emoji: '🚗', name: 'Car', category: 3, keywords: ['transport', 'vehicle'] },
  { emoji: '🚌', name: 'School Bus', category: 3, keywords: ['bus', 'transport', 'ride'] },

  // 4: Symbols & Hearts
  { emoji: '❤️', name: 'Red Heart', category: 4, keywords: ['love', 'like', 'heart'] },
  { emoji: '💙', name: 'Blue Heart', category: 4, keywords: ['peace', 'loyalty'] },
  { emoji: '💚', name: 'Green Heart', category: 4, keywords: ['nature', 'friendship'] },
  { emoji: '💛', name: 'Yellow Heart', category: 4, keywords: ['joy', 'friendship'] },
  { emoji: '💜', name: 'Purple Heart', category: 4, keywords: ['glamour', 'kindness'] },
  { emoji: '🤍', name: 'White Heart', category: 4, keywords: ['pure', 'peace'] },
  { emoji: '💖', name: 'Sparkling Heart', category: 4, keywords: ['love', 'sparkle'] },
  { emoji: '💕', name: 'Two Hearts', category: 4, keywords: ['love', 'sweet'] },
  { emoji: '✅', name: 'Check Mark', category: 4, keywords: ['done', 'yes', 'verified', 'correct'] },
  { emoji: '✔️', name: 'Check', category: 4, keywords: ['tick', 'correct'] },
  { emoji: '❌', name: 'Cross Mark', category: 4, keywords: ['no', 'wrong', 'cancel'] },
  { emoji: '⚠️', name: 'Warning', category: 4, keywords: ['alert', 'caution', 'notice'] },
  { emoji: '⛔', name: 'No Entry', category: 4, keywords: ['stop', 'denied'] },
  { emoji: '❗', name: 'Exclamation', category: 4, keywords: ['important', 'attention'] },
  { emoji: '❓', name: 'Question', category: 4, keywords: ['help', 'ask', 'doubt'] },
  { emoji: '💬', name: 'Speech Balloon', category: 4, keywords: ['chat', 'message', 'comment'] },
  { emoji: '💭', name: 'Thought Bubble', category: 4, keywords: ['think', 'idea'] },
  { emoji: '🆗', name: 'OK Button', category: 4, keywords: ['fine', 'ready'] },
  { emoji: '🔒', name: 'Lock', category: 4, keywords: ['secure', 'encrypted', 'private'] },
  { emoji: '🔓', name: 'Unlock', category: 4, keywords: ['open', 'public'] },
  { emoji: '🔑', name: 'Key', category: 4, keywords: ['access', 'password'] },
];

interface EmojiPickerPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  anchorEl,
  open,
  onClose,
  onSelectEmoji,
}) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return EMOJI_DATABASE.filter((item) => item.category === activeCategory);
    }
    return EMOJI_DATABASE.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [searchQuery, activeCategory]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    // Don't close immediately so user can insert multiple emojis if desired,
    // but tap outside or close icon closes it
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          width: { xs: 320, sm: 360 },
          maxHeight: 380,
          borderRadius: '16px',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
        },
      }}
    >
      {/* Header with Search & Close */}
      <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                fontSize: '13px',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25 }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <IconButton size="small" onClick={onClose} sx={{ color: '#94a3b8', p: 0.75 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Category Tabs (shown when not searching) */}
        {!searchQuery && (
          <Tabs
            value={activeCategory}
            onChange={(_, val) => setActiveCategory(val)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              mt: 1,
              '& .MuiTab-root': {
                minHeight: 36,
                minWidth: 0,
                p: 0.5,
                color: '#64748b',
                '&.Mui-selected': { color: '#4f46e5' },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#4f46e5',
                height: 2.5,
                borderRadius: '2px',
              },
            }}
          >
            <Tab icon={<SmileIcon sx={{ fontSize: 18 }} />} aria-label="Smileys" title="Smileys" />
            <Tab icon={<HandIcon sx={{ fontSize: 18 }} />} aria-label="Gestures" title="Gestures" />
            <Tab icon={<SchoolIcon sx={{ fontSize: 18 }} />} aria-label="School" title="School & Work" />
            <Tab icon={<PartyIcon sx={{ fontSize: 18 }} />} aria-label="Celebration" title="Celebration" />
            <Tab icon={<HeartIcon sx={{ fontSize: 18 }} />} aria-label="Symbols" title="Symbols & Hearts" />
          </Tabs>
        )}
      </Box>

      {/* Emoji Grid Viewport */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.75,
          alignContent: 'flex-start',
          minHeight: 220,
          maxHeight: 260,
          bgcolor: '#ffffff',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
        }}
      >
        {filteredEmojis.length === 0 ? (
          <Box sx={{ gridColumn: 'span 7', py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="#94a3b8" sx={{ fontSize: '13px' }}>
              No emojis found for "{searchQuery}"
            </Typography>
          </Box>
        ) : (
          filteredEmojis.map((item) => (
            <Tooltip key={item.name + item.emoji} title={item.name} arrow placement="top">
              <Box
                component="button"
                type="button"
                onClick={() => handleSelect(item.emoji)}
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  lineHeight: 1,
                  fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif',
                  borderRadius: '10px',
                  border: 'none',
                  bgcolor: 'transparent',
                  color: '#000000',
                  opacity: 1,
                  cursor: 'pointer',
                  p: 0,
                  outline: 'none',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'transform 0.12s ease, background-color 0.12s ease',
                  '&:hover': {
                    bgcolor: '#eef2ff',
                    transform: 'scale(1.25)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                <span style={{ display: 'inline-block', lineHeight: 1, color: '#000000', opacity: 1, filter: 'none' }}>
                  {item.emoji}
                </span>
              </Box>
            </Tooltip>
          ))
        )}
      </Box>

      {/* Footer hint */}
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '10px', fontWeight: 600 }}>
          {searchQuery ? `${filteredEmojis.length} results` : 'Click to insert'}
        </Typography>
        <Typography variant="caption" color="#94a3b8" sx={{ fontSize: '10px' }}>
          Unicode standard
        </Typography>
      </Box>
    </Popover>
  );
};

export default EmojiPickerPopover;
