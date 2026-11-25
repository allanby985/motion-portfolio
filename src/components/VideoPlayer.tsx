import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { VideoSource } from '../data/types'
import { asset, formatTime } from '../lib/media'
import {
  IconFullscreen,
  IconMuted,
  IconPause,
  IconPlay,
  IconVolume,
} from './icons'

interface VideoPlayerProps {
  source: VideoSource
  title: string
  className?: string
}

export function VideoPlayer({ source, title, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [activated, setActivated] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const activate = useCallback(() => {
    if (source.kind === 'file') {
      const video = videoRef.current
      if (video) {
        void video.play().catch(() => {
          // 浏览器拒绝自动播放时保持暂停，控制条仍可操作
        })
      }
    }
    setActivated(true)
  }, [source.kind])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const seek = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const next = Number(event.target.value)
    if (Number.isFinite(next)) {
      video.currentTime = next
      setTime(next)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    if (wrapper.requestFullscreen) {
      void wrapper.requestFullscreen().catch(() => {})
      return
    }
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    video?.webkitEnterFullscreen?.()
  }, [])

  const showCover = !activated || failed
  const poster = asset(source.poster)
  const bilibiliUrl =
    source.kind === 'bilibili'
      ? `https://player.bilibili.com/player.html?bvid=${source.bvid}&autoplay=1&high_quality=1&danmaku=0`
      : ''
  const bilibiliPage =
    source.kind === 'bilibili' ? `https://www.bilibili.com/video/${source.bvid}` : ''

  return (
    <div
      ref={wrapperRef}
      className={`player ${fullscreen ? 'is-fullscreen' : ''} ${className}`.trim()}
      aria-label={`${title} 视频播放器`}
      role="group"
    >
      {source.kind === 'file' && (
        <video
          ref={videoRef}
          className="player__video"
          src={asset(source.src)}
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          onError={() => setFailed(true)}
          onClick={togglePlay}
        />
      )}

      {source.kind === 'bilibili' && activated && (
        <iframe
          className="player__iframe"
          src={bilibiliUrl}
          title={`${title} — Bilibili`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {showCover && (
        <div className={`player__cover ${failed ? 'is-error' : ''}`.trim()}>
          <img className="player__poster" src={poster} alt={`${title} 封面`} />
          <div className="player__scrim" aria-hidden="true" />
          <div className="player__center">
            <button
              type="button"
              className="player__big-play"
              onClick={activate}
              disabled={failed}
              aria-label={failed ? '视频暂不可用' : `播放 ${title}`}
            >
              <IconPlay width={26} height={26} />
            </button>
            <span className="player__cta">{failed ? '视频暂不可用' : '播放影片'}</span>
          </div>
          <div className="player__cover-meta">
            <span className="player__cover-title">{title}</span>
            {source.duration && <span className="player__cover-time">{source.duration}</span>}
          </div>
          {failed && (
            <p className="player__error">
              视频加载失败。请刷新页面重试，或通过邮箱联系我获取成片。
            </p>
          )}
        </div>
      )}

      {source.kind === 'file' && activated && !failed && (
        <div className="player__controls" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="player__icon-button"
            onClick={togglePlay}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
          </button>
          <span className="player__time">
            {formatTime(time)} <span>/ {formatTime(duration)}</span>
          </span>
          <input
            className="player__range"
            type="range"
            min={0}
            max={duration > 0 ? duration : 0.1}
            step={0.01}
            value={Math.min(time, duration || 0)}
            onChange={seek}
            aria-label="播放进度"
            style={{ ['--progress' as string]: `${duration ? (time / duration) * 100 : 0}%` }}
          />
          <button
            type="button"
            className="player__icon-button"
            onClick={toggleMute}
            aria-label={muted ? '取消静音' : '静音'}
          >
            {muted ? <IconMuted width={18} height={18} /> : <IconVolume width={18} height={18} />}
          </button>
          <button
            type="button"
            className="player__icon-button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? '退出全屏' : '全屏'}
          >
            <IconFullscreen width={18} height={18} />
          </button>
        </div>
      )}

      {source.kind === 'bilibili' && activated && (
        <a
          className="player__bili-link"
          href={bilibiliPage}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          在 B 站打开 ↗
        </a>
      )}

      {source.note && <p className="player__note">{source.note}</p>}
    </div>
  )
}
