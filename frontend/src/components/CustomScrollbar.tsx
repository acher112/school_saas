"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  isRTL?: boolean;
}

export function CustomScrollbar({
  children,
  className = "",
  isRTL = false,
}: CustomScrollbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  const updateScrollbar = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { clientHeight, scrollHeight, scrollTop } = el;
    if (scrollHeight > clientHeight && clientHeight > 0) {
      setIsScrollable(true);
      // Minimum thumb height of 36px so it's always easily grab-able
      const calculatedHeight = Math.max(36, (clientHeight / scrollHeight) * clientHeight);
      setThumbHeight(calculatedHeight);

      const maxScrollTop = scrollHeight - clientHeight;
      const maxThumbTop = clientHeight - calculatedHeight;
      const calculatedTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;
      setThumbTop(calculatedTop);
    } else {
      setIsScrollable(false);
    }
  }, []);

  useEffect(() => {
    updateScrollbar();

    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      updateScrollbar();
    });

    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    window.addEventListener("resize", updateScrollbar);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollbar);
    };
  }, [updateScrollbar, children]);

  const handleScroll = () => {
    updateScrollbar();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = scrollRef.current ? scrollRef.current.scrollTop : 0;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = scrollRef.current;
      if (!el) return;

      const deltaY = e.clientY - dragStartY.current;
      const { clientHeight, scrollHeight } = el;
      const maxThumbTop = clientHeight - thumbHeight;
      const maxScrollTop = scrollHeight - clientHeight;

      if (maxThumbTop > 0) {
        const scrollDelta = (deltaY / maxThumbTop) * maxScrollTop;
        el.scrollTop = dragStartScrollTop.current + scrollDelta;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, thumbHeight]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current || !scrollRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const { clientHeight, scrollHeight } = scrollRef.current;
    const maxThumbTop = clientHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    if (maxThumbTop > 0) {
      const targetScrollTop = ((clickY - thumbHeight / 2) / maxThumbTop) * maxScrollTop;
      scrollRef.current.scrollTo({
        top: Math.max(0, Math.min(maxScrollTop, targetScrollTop)),
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-h-0 overflow-hidden ${className}`}
    >
      {/* Scrollable Content Container (native scrollbars hidden so custom one controls visual presentation) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Always-visible Custom Scrollbar Track & Thumb matching Old Design PerfectScrollbar */}
      {isScrollable && (
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className={`absolute top-2 bottom-2 ${
            isRTL ? "left-1" : "right-1"
          } w-[6px] rounded-full bg-[#262B43]/6 dark:bg-[#EAEAFF]/8 cursor-pointer z-30 transition-all select-none`}
          aria-hidden="true"
        >
          <div
            onMouseDown={handleMouseDown}
            style={{
              height: `${thumbHeight}px`,
              transform: `translateY(${thumbTop}px)`,
            }}
            className={`w-full rounded-full transition-colors shadow-xs ${
              isDragging
                ? "bg-[#4B4F68] dark:bg-[#A1A5FF]"
                : "bg-[#787C91] hover:bg-[#4B4F68] dark:bg-[#888DFF] dark:hover:bg-[#A1A5FF]"
            }`}
          />
        </div>
      )}
    </div>
  );
}
