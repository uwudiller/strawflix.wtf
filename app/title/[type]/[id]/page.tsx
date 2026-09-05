"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import Background from "@/components/Background";
import TitlePage from "@/components/TitlePage";
import { AuthProvider, useAuth } from "@/lib/auth";
import { WatchlistProvider } from "@/lib/watchlist";
import Onboarding from "@/components/Onboarding";

function Shell({
  type,
  id,
}: {
  type: "movie" | "series";
  id: string;
}) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const seasonRaw = searchParams.get("season");
  const episodeRaw = searchParams.get("episode");
  const initialSeason = seasonRaw ? Number(seasonRaw) : undefined;
  const initialEpisode = episodeRaw ? Number(episodeRaw) : undefined;

  return (
    <>
      <Background />
      {token ? (
        <TitlePage
          type={type}
          imdbId={id}
          initialSeason={
            initialSeason && initialSeason > 0 ? initialSeason : undefined
          }
          initialEpisode={
            initialEpisode && initialEpisode > 0 ? initialEpisode : undefined
          }
        />
      ) : (
        <Onboarding />
      )}
    </>
  );
}

export default function TitleRoute({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type: rawType, id } = use(params);
  const type = rawType === "series" ? "series" : "movie";

  return (
    <AuthProvider>
      <WatchlistProvider>
        <Suspense fallback={<Background />}>
          <Shell type={type} id={id} />
        </Suspense>
      </WatchlistProvider>
    </AuthProvider>
  );
}