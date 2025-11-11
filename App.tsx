import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GiftIcon, UsersIcon, TrophyIcon, TrashIcon, RefreshCwIcon, HistoryIcon, UploadIcon, DownloadIcon } from './components/Icons';

declare const XLSX: any;

const LOCAL_STORAGE_KEY_PARTICIPANTS = 'luckyDraw_participants';
const LOCAL_STORAGE_KEY_DRAWN = 'luckyDraw_drawnParticipants';

// Base64 encoded audio for sound effects to avoid needing extra files
const SPINNING_SOUND_BASE64 = 'data:audio/mpeg;base64,SUQzBAAAAAAAIVRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzNAAIVFNzZQAAAA8AAANMYXZmNTguNzYuMTAw//uQxAAAAAABFVFBRUgA8ALM/8z/xAAE1ERERP/8AAMA0VEREREREREQ0RERERERERERDRERERERERERENCg0RDREREQ0KDREREREQ0NDQ0NERERDRERDQ0NDQ0NDQ0NAADSUxIRETEyMc9UEtLRUREQ0RERENDQ0NDQ0NDQ0NEREREREREREQ0RERERERERERDREREREREREQ0RERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxAsAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxBgAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxBwAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxCAAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxCQAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxCwAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxDAAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxDQAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxDwAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxEAAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxEQAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxEgAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxFAAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxFQAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxFwAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R//uQxGAAAANIAAAAQAAAaIz/zP/EAATURERER//wAAwDRERERERERENA0RERERERERDRDRERERERERDQoNEQ0RERENCg0RERERDQ0NDQ0RERDQ0RDRDQ0NDQ0NDQ0AANJTEhERMTIxz1Q SURFRENEUkRERE0NDQ0NDQ0NDQ1ERERERERERENE牡丹ERERERERDRERERERERENCg0RERERERERDRERERERERERDQoNEREQ0RERDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NEREREREREREREREREREREREREREREREREQ0NDQ0NERDQ0NERERDQ0RDRDQ0NDQ0RDRDRDQ0NDQ0R';
const WIN_SOUND_BASE64 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RYWFgAAAASAAADbWFqb3JfYnJhbmQAbXAzNAAIVFNzZQAAAA8AAANMYXZmNTguNzYuMTAw//uQxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAMIASGQAYkZglwAxIHYA6AACQUgA/+2e//uQxAUwAAANIAAAAQAAAaABTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQxCEwAAANIAAAAQAAAaABTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-i..MPx/8//8BAAABodHRwOi8vd3d3Lmx1Y2Fza3JlbWVycy5jb20vbXVzaWMvAAACaHR0cDovL3d3dy5sdWNhc2tyZW1lcnMuY29tL211c2ljLy9AQEA/8AAMIQyGQAYUglgAxIF2AIaAACQcgA/+2e//uQxDAwAAANIAAAAQAAAaABTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-..MP3/8AAMIQyGQAYUglgAxIF2AIaAACQcgA/+2e//uQxDAwAAANIAAAAQAAAaABTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-..MP3';

const App: React.FC = () => {
    const [participants, setParticipants] = useState<string[]>([]);
    const [newParticipantInput, setNewParticipantInput] = useState<string>('');
    const [participantError, setParticipantError] = useState<string>('');
    
    const [numWinnersInput, setNumWinnersInput] = useState<string>('1');
    const [winners, setWinners] = useState<string[]>([]);
    const [drawnParticipants, setDrawnParticipants] = useState<string[]>([]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [drawingName, setDrawingName] = useState<string>('');
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const spinningSoundRef = useRef<HTMLAudioElement>(null);
    const winSoundRef = useRef<HTMLAudioElement>(null);


    useEffect(() => {
        try {
            const storedDrawn = localStorage.getItem(LOCAL_STORAGE_KEY_DRAWN);
            if (storedDrawn) {
                setDrawnParticipants(JSON.parse(storedDrawn));
            }
            const storedParticipants = localStorage.getItem(LOCAL_STORAGE_KEY_PARTICIPANTS);
            if (storedParticipants) {
                setParticipants(JSON.parse(storedParticipants));
            }
        } catch (e) {
            console.error("Failed to parse data from localStorage", e);
            setDrawnParticipants([]);
            setParticipants([]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY_PARTICIPANTS, JSON.stringify(participants));
    }, [participants]);
    
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY_DRAWN, JSON.stringify(drawnParticipants));
    }, [drawnParticipants]);

    const eligibleParticipants = useMemo(() => 
        participants.filter(p => !drawnParticipants.includes(p)),
        [participants, drawnParticipants]
    );

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        const newName = newParticipantInput.trim();
        if (!newName) {
            setParticipantError('Tên người tham gia không được để trống.');
            return;
        }
        if (participants.some(p => p.toLowerCase() === newName.toLowerCase())) {
            setParticipantError('Người tham gia này đã có trong danh sách.');
            return;
        }
        setParticipants(prev => [...prev, newName].sort((a, b) => a.localeCompare(b)));
        setNewParticipantInput('');
        setParticipantError('');
    };

    const handleDeleteParticipant = (nameToDelete: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${nameToDelete}"? Thao tác này cũng sẽ xóa họ khỏi lịch sử trúng thưởng (nếu có) và cho phép họ tham gia lại.`)) {
            setParticipants(prev => prev.filter(p => p !== nameToDelete));
            setDrawnParticipants(prev => prev.filter(p => p !== nameToDelete));
        }
    };

    const handleDraw = useCallback(() => {
        setError('');
        setWinners([]);

        const numWinners = parseInt(numWinnersInput, 10);

        if (isNaN(numWinners) || numWinners <= 0) {
            setError('Số người trúng thưởng phải là một số lớn hơn 0.');
            return;
        }

        if (eligibleParticipants.length === 0) {
            setError('Không có người nào hợp lệ để tham gia bốc thăm.');
            return;
        }

        if (numWinners > eligibleParticipants.length) {
            setError(`Số người trúng thưởng không thể lớn hơn số người tham gia hợp lệ (${eligibleParticipants.length}).`);
            return;
        }

        setIsDrawing(true);
        spinningSoundRef.current?.play().catch(e => console.error("Audio play failed:", e));

        const animationDuration = 3000;
        const startTime = Date.now();

        const animationStep = () => {
            if (eligibleParticipants.length > 0) {
                const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
                setDrawingName(eligibleParticipants[randomIndex]);
            }
             if (Date.now() - startTime < animationDuration) {
                animationFrameId.current = requestAnimationFrame(animationStep);
            }
        };
        
        animationFrameId.current = requestAnimationFrame(animationStep);

        setTimeout(() => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            
            spinningSoundRef.current?.pause();
            if(spinningSoundRef.current) spinningSoundRef.current.currentTime = 0;
            winSoundRef.current?.play().catch(e => console.error("Audio play failed:", e));

            const shuffled = [...eligibleParticipants].sort(() => 0.5 - Math.random());
            const newWinners = shuffled.slice(0, numWinners);
            
            setWinners(newWinners);
            
            const updatedDrawnParticipants = [...drawnParticipants, ...newWinners].sort((a,b) => a.localeCompare(b));
            setDrawnParticipants(updatedDrawnParticipants);
            
            setIsDrawing(false);
            setDrawingName('');
        }, animationDuration);

    }, [numWinnersInput, eligibleParticipants, drawnParticipants]);
    
    const handleClearAll = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu, bao gồm cả danh sách tham gia và lịch sử trúng thưởng?')) {
            setParticipants([]);
            setNumWinnersInput('1');
            setWinners([]);
            setDrawnParticipants([]);
            setError('');
            setParticipantError('');
            localStorage.removeItem(LOCAL_STORAGE_KEY_PARTICIPANTS);
            localStorage.removeItem(LOCAL_STORAGE_KEY_DRAWN);
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const newNames = json
                    .slice(1) // Skip header row
                    .map(row => row[0]) // Get first column
                    .filter(name => name && typeof name === 'string' && name.trim() !== '')
                    .map(name => (name as string).trim());
                
                if (newNames.length === 0) {
                    alert('Không tìm thấy tên hợp lệ trong cột đầu tiên của file Excel/CSV.');
                    return;
                }

                setParticipants(prev => {
                    const existingNames = new Set(prev.map(p => p.toLowerCase()));
                    const uniqueNewNames = newNames.filter(name => !existingNames.has(name.toLowerCase()));
                    
                    if (uniqueNewNames.length === 0) {
                        alert(`Tất cả ${newNames.length} tên trong file đã có trong danh sách.`);
                        return prev;
                    }
                    
                    alert(`Đã thêm thành công ${uniqueNewNames.length} người tham gia mới. ${newNames.length - uniqueNewNames.length} tên trùng lặp đã được bỏ qua.`);
                    
                    return [...prev, ...uniqueNewNames].sort((a, b) => a.localeCompare(b));
                });

            } catch (err) {
                console.error("Error reading file:", err);
                setError('Có lỗi xảy ra khi đọc file. Vui lòng đảm bảo file có định dạng đúng.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
        const data = [
            ["Tên Người Tham Gia"],
            ["Nguyễn Văn A"],
            ["Trần Thị B"],
            ["Lê Thị C"],
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        worksheet['!cols'] = [{ wch: 30 }]; // Set column width to 30 characters
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh Sách Tham Gia");
        XLSX.writeFile(workbook, "Mau_Danh_Sach_Tham_Gia.xlsx");
    };

    const handleExportWinners = () => {
        if (drawnParticipants.length === 0) {
            alert("Chưa có ai trúng thưởng để xuất file.");
            return;
        }
    
        const data = [
            ["STT", "Tên Người Trúng Thưởng"],
            ...drawnParticipants.map((winner, index) => [index + 1, winner])
        ];
    
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh Sách Trúng Thưởng");
    
        const today = new Date();
        const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        XLSX.writeFile(workbook, `Danh_Sach_Trung_Thuong_${dateString}.xlsx`);
    };


    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
            <audio ref={spinningSoundRef} src={SPINNING_SOUND_BASE64} loop preload="auto"></audio>
            <audio ref={winSoundRef} src={WIN_SOUND_BASE64} preload="auto"></audio>
            
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 rounded-full p-3 mb-4">
                        <GiftIcon className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Bốc Thăm May Mắn</h1>
                    <p className="mt-2 text-lg text-gray-600">Công bằng - Minh bạch - Mỗi người chỉ trúng 1 lần</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cột cài đặt */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <UsersIcon className="w-7 h-7 mr-3 text-blue-500" />
                            <span>Cài đặt bốc thăm</span>
                        </h2>
                        
                        <div className="space-y-6">
                           <div>
                                <label htmlFor="newParticipant" className="block text-sm font-medium text-gray-700 mb-1">
                                    Quản lý người tham gia
                                </label>
                                <form onSubmit={handleAddParticipant} className="flex gap-2">
                                    <input
                                        id="newParticipant"
                                        type="text"
                                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 bg-gray-50"
                                        placeholder="Nhập tên và nhấn Enter để thêm"
                                        value={newParticipantInput}
                                        onChange={(e) => setNewParticipantInput(e.target.value)}
                                        disabled={isDrawing}
                                    />
                                    <button 
                                        type="submit" 
                                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                                        disabled={isDrawing || !newParticipantInput.trim()}
                                    >
                                        Thêm
                                    </button>
                                </form>
                                {participantError && <p className="text-red-500 text-sm mt-1">{participantError}</p>}

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileImport}
                                        className="hidden"
                                        accept=".xlsx, .xls, .csv"
                                    />
                                    <button
                                        onClick={triggerFileInput}
                                        className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-800 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-colors"
                                        disabled={isDrawing}
                                    >
                                        <UploadIcon className="w-5 h-5" />
                                        Import từ Excel
                                    </button>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:bg-gray-400 transition-colors"
                                        disabled={isDrawing}
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                        Tải file mẫu
                                    </button>
                                </div>


                                <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-1">
                                    {participants.length > 0 ? (
                                        participants.map((p, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
                                                <div className="flex items-center truncate">
                                                    {drawnParticipants.includes(p) ? (
                                                        <TrophyIcon className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-4 h-4 mr-2 flex-shrink-0"></div>
                                                    )}
                                                    <span className={`truncate ${drawnParticipants.includes(p) ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {p}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteParticipant(p)} 
                                                    disabled={isDrawing} 
                                                    className="ml-2 text-gray-400 hover:text-red-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                                                    aria-label={`Xóa ${p}`}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">Chưa có ai trong danh sách.</p>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Tổng số: {participants.length} | Hợp lệ: <span className="font-semibold text-green-600">{eligibleParticipants.length}</span></p>
                            </div>

                            <div>
                                <label htmlFor="numWinners" className="block text-sm font-medium text-gray-700 mb-1">
                                    Số người trúng thưởng
                                </label>
                                <input
                                    type="number"
                                    id="numWinners"
                                    min="1"
                                    className="w-full max-w-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-800 bg-gray-50"
                                    value={numWinnersInput}
                                    onChange={(e) => setNumWinnersInput(e.target.value)}
                                    disabled={isDrawing}
                                />
                            </div>

                            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                            
                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    onClick={handleDraw}
                                    disabled={isDrawing || eligibleParticipants.length === 0}
                                    className="flex-grow sm:flex-grow-0 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 ease-in-out shadow-md"
                                >
                                    {isDrawing ? 'Đang quay số...' : 'Bắt đầu bốc thăm'}
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={isDrawing}
                                    className="flex-grow sm:flex-grow-0 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 transition duration-300 ease-in-out shadow-md flex items-center justify-center gap-2"
                                >
                                    <TrashIcon className="w-5 h-5"/> Xóa tất cả
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cột kết quả */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex flex-col">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <TrophyIcon className="w-7 h-7 mr-3 text-yellow-500" />
                            <span>Kết quả</span>
                        </h2>
                        
                        <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 rounded-lg p-6 text-center min-h-[300px] relative overflow-hidden">
                            {isDrawing ? (
                                <div className="z-20 text-center">
                                     <div 
                                        className="text-5xl lg:text-7xl font-bold text-blue-600 transition-all duration-100 tabular-nums" 
                                        style={{ 
                                            minHeight: '100px', 
                                            textShadow: '0 0 10px rgba(37, 99, 235, 0.3), 0 0 20px rgba(37, 99, 235, 0.2)' 
                                        }}
                                    >
                                        {drawingName}
                                    </div>
                                    <p className="text-gray-500 mt-4 text-lg animate-pulse">Đang tìm người may mắn...</p>
                                </div>
                            ) : winners.length > 0 ? (
                                <div className="w-full">
                                    <h3 className="text-xl font-semibold text-green-600 mb-4">Xin chúc mừng những người thắng cuộc!</h3>
                                    <ul className="space-y-2 text-left max-h-80 overflow-y-auto pr-2">
                                        {winners.map((winner, index) => (
                                            <li key={index} className="bg-green-100 text-green-800 font-semibold p-3 rounded-md flex items-center text-lg animate-fade-in">
                                                <TrophyIcon className="w-5 h-5 mr-3 text-yellow-500 flex-shrink-0" />
                                                <span>{winner}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <p>Kết quả bốc thăm sẽ được hiển thị ở đây.</p>
                                    <p>Hãy nhấn nút "Bắt đầu bốc thăm" để quay số.</p>
                                </div>
                            )}
                        </div>
                         {winners.length > 0 && !isDrawing &&
                            <button
                                onClick={() => setWinners([])}
                                className="mt-4 w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-300 ease-in-out flex items-center justify-center gap-2"
                            >
                                <RefreshCwIcon className="w-5 h-5"/> Bốc thăm lại
                            </button>
                        }
                    </div>
                </main>
                
                 {/* Lịch sử đã trúng */}
                 <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold flex items-center text-gray-700">
                            <HistoryIcon className="w-6 h-6 mr-3" />
                            <span>Lịch sử đã trúng thưởng ({drawnParticipants.length} người)</span>
                        </h2>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={handleExportWinners}
                                disabled={drawnParticipants.length === 0}
                                className="flex items-center justify-center gap-2 bg-green-100 text-green-800 font-semibold py-2 px-3 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
                                aria-label="Xuất danh sách người trúng thưởng ra file Excel"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Xuất Excel</span>
                            </button>
                            <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-md hover:bg-gray-100" aria-label="Ẩn/hiện lịch sử">
                                <span className="transform transition-transform duration-300 inline-block" style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </span>
                            </button>
                        </div>
                    </div>
                    {showHistory && (
                        <div className="mt-4 max-h-60 overflow-y-auto pr-2">
                            {drawnParticipants.length > 0 ? (
                                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 text-sm">
                                    {drawnParticipants.map((p, i) => (
                                        <li key={i} className="bg-gray-100 p-2 rounded-md text-gray-600 truncate flex items-center">
                                            <TrophyIcon className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">Chưa có ai trúng thưởng.</p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default App;