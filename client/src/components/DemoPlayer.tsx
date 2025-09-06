import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface DemoPlayerProps {
  demoUrl: string;
  title: string;
  className?: string;
}

export function DemoPlayer({ demoUrl, title, className = "" }: DemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`} data-testid="demo-player">
      <audio
        ref={audioRef}
        src={demoUrl}
        preload="metadata"
        data-testid="audio-element"
      />
      
      <div className="flex items-center gap-3 mb-3">
        <Button
          onClick={togglePlay}
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          data-testid={isPlaying ? "button-pause" : "button-play"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" data-testid="text-demo-title">Demo: {title}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500" data-testid="text-current-time">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
              data-testid="slider-progress"
            />
            <span className="text-xs text-gray-500" data-testid="text-duration">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-gray-500" />
        <Slider
          value={[volume]}
          max={1}
          step={0.1}
          onValueChange={handleVolumeChange}
          className="w-20"
          data-testid="slider-volume"
        />
      </div>
    </div>
  );
}