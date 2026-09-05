import { useCallback, useState } from "react";

const PROFILE_KEY = "strawflix_profile";

export interface UserProfile {
  preferredQuality?: string;
  defaultPlaybackSpeed?: number;
  watchedHistory?: string[]; // array of imdb IDs
  favorites?: string[]; // array of imdb IDs
  theme?: "dark" | "light" | "auto";
}

function readProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : {};
  } catch {
    return {};
  }
}

function writeProfile(profile: UserProfile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function useProfile(): [UserProfile, (updates: Partial<UserProfile>) => void] {
  const [profile, setProfile] = useState<UserProfile>(() => readProfile());
  const setProfileState = useCallback((updates: Partial<UserProfile>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    writeProfile(next);
  }, [profile]);
  return [profile, setProfileState];
}