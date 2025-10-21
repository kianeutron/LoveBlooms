"use client";
import React, { useState } from "react";
import Bookshelf from "@/components/Bookshelf";
import RoomBackground from "@/components/RoomBackground";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <RoomBackground />
      <Bookshelf onPickCorrect={() => {}} />
    </div>
  );
}
