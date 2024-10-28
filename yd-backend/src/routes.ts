import express,{Request,Response} from 'express';
import  ytdl  from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import {formatTime } from './utilities/helpers.js';
import {ExtendedChapter} from './types.js';
import _ from 'lodash';

let router = express.Router();

if (typeof ffmpegPath === 'string') {
    ffmpeg.setFfmpegPath(ffmpegPath);
  } else {
    console.error('Error: ffmpeg-static did not return a valid path.');
  }


router.post('/fetchDetails', async (req: Request, res: Response):Promise<void> => {
    const { url } = req.body;
    try {
        const info = await ytdl.getInfo(url);
        const description = info.videoDetails;
        // const timestamps = extractTimestamps(description);

        let videoLengthSeconds:number = Number(info.videoDetails.lengthSeconds);
        const isHourFormat = videoLengthSeconds >= 3600;
        let chapters: ExtendedChapter[]  = info.videoDetails.chapters;

    for (let i = 0; i < chapters.length; i++) {
    const startTime = chapters[i].start_time;
    const endTime = (i < chapters.length - 1) ? chapters[i + 1].start_time : videoLengthSeconds;

    chapters[i].start_time_formatted = formatTime(startTime, isHourFormat);
    chapters[i].end_time = endTime;
    chapters[i].end_time_formatted = formatTime(endTime, isHourFormat);
    }

    let videoLengthFormatted = formatTime(videoLengthSeconds, isHourFormat);
        res.status(200).json({ success: true, data : {description} });
    } catch (error) {
       res.status(500).json({ success: false, error: 'Error fetching video information.' });
    }
});

router.post('/downloadVideo', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, timestamps } = req.body;
      if (!url) {
        res.status(400).json({ success: false, error: 'URL is required.' });
        return;
      }
  
      const info = await ytdl.getInfo(url);
      const videoTitle = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
      const format = 'mp4';
  
      // Set headers before starting the stream
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.${format}"`);
      res.header('Content-Type', `video/${format}`);
  
      // Define videoStream with error handling for 410 status
      const videoStream = ytdl(url, {
        quality: '136',
        highWaterMark: 32 * 1024 * 1024,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
          }
        }
      });
  
      // Handle stream errors separately
      videoStream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Video is restricted or unavailable.' });
        }
      });
  
      if (!_.isEmpty(timestamps)) {
        // Process the video with ffmpeg using start and end times
        ffmpeg(videoStream)
          .setStartTime(parseInt(timestamps.startTime))
          .setDuration(parseInt(timestamps.endTime) - parseInt(timestamps.startTime))
          .format(format)
          .on('error', (err) => {
            console.error('Error during trimming:', err);
            if (!res.headersSent) {
              res.status(500).send('Error trimming the video.');
            }
          })
          .on('end', () => {
            console.log('Video trimming completed');
          })
          .pipe(res, { end: true });
      } else {
        // Direct download without trimming
        ffmpeg(videoStream)
          .format(format)
          .on('error', (err) => {
            console.error('Error during conversion:', err);
            if (!res.headersSent) {
              res.status(500).send('Error converting video.');
            }
          })
          .on('end', () => {
            console.log('Video download completed');
          })
          .pipe(res, { end: true });
      }
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error downloading video.' });
      }
    }
  });

  router.post('/downloadAudio', async (req: Request, res: Response): Promise<void> => {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ success: false, error: 'URL is required.' });
        return;
      }
  
      const info = await ytdl.getInfo(url);

      const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

      console.log(`Downloading audio: ${title}`);
    
      // Audio stream
      const audioStream = ytdl(url, { quality: 'highestaudio' });
    
      // Use ffmpeg to convert audio to mp3
      ffmpeg(audioStream)
        .audioBitrate(128)
        .save(`${title}_audio.mp3`)
        .on('end', () => {
          console.log(`Audio downloaded: ${title}_audio.mp3`);
        });
      res.status(200).send("ok");
    } catch (error) {    
      if (!res.headersSent) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error downloading audio.' });
      }
    }   
    });

export default router;