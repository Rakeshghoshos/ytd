import ytdl from "ytdl-core";
import fs from 'fs';

export function formatTime(seconds:any, isHourFormat:Boolean) : string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
  
    if (isHourFormat) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  export function calculateDuration(start: string, end: string): number {
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
  
    const startSeconds = (startParts[0] * 3600) + (startParts[1] * 60) + startParts[2];
    const endSeconds = (endParts[0] * 3600) + (endParts[1] * 60) + endParts[2];
  
    return endSeconds - startSeconds;
  }
  