"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, SendHorizonal } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/hooks/use-i18n";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fetchUserPublic } from "@/services/auth";
import {
  fetchConversation,
  fetchConversations,
  sendMessage,
} from "@/services/messages";
import type { PeerInfo } from "@/types/message";
import { getInitials } from "@/utils/avatar";
import { formatRelativeTime } from "@/utils/datetime";

function ConversationList({
  selectedPeerId,
  onSelect,
  className,
}: {
  selectedPeerId: number | null;
  onSelect: (peerId: number) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 15_000,
  });

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{t("messages.conversations")}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("messages.emptyList")}
            </p>
          </div>
        ) : (
          <ul>
            {data.map((conversation) => (
              <li key={conversation.peer.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.peer.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                    selectedPeerId === conversation.peer.id && "bg-accent"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={conversation.peer.avatar_url ?? undefined}
                      alt={conversation.peer.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-sm text-primary">
                      {getInitials(conversation.peer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {conversation.peer.name}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(conversation.last_message.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.last_message.is_mine ? t("messages.me") : ""}
                        {conversation.last_message.content}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function ChatPanel({
  peerId,
  onBack,
  className,
}: {
  peerId: number;
  onBack: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 优先从会话列表取对方信息；深链新会话时单独请求
  const conversations = queryClient.getQueryData<
    { peer: PeerInfo }[] | undefined
  >(["conversations"]);
  const knownPeer = conversations?.find((c) => c.peer.id === peerId)?.peer;

  const { data: fetchedPeer } = useQuery({
    queryKey: ["user-public", peerId],
    queryFn: () => fetchUserPublic(peerId),
    enabled: !knownPeer,
    staleTime: 5 * 60 * 1000,
  });
  const peer = knownPeer ?? fetchedPeer;

  const { data: messages, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["conversation", peerId],
    queryFn: () => fetchConversation(peerId),
    refetchInterval: 4_000,
  });

  // 打开会话即标记已读，同步未读徽章与会话列表
  useEffect(() => {
    if (dataUpdatedAt) {
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt]);

  // 新消息时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(peerId, content),
    onSuccess: async () => {
      setSendError(null);
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["conversation", peerId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => setSendError(getApiErrorMessage(error)),
  });

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
  };

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 h-8 w-8 md:hidden"
          onClick={onBack}
          aria-label={t("messages.backList")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={peer?.avatar_url ?? undefined} alt={peer?.name} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {peer ? getInitials(peer.name) : "…"}
          </AvatarFallback>
        </Avatar>
        <Link href={`/users/${peerId}`} className="min-w-0 transition-opacity hover:opacity-80">
          <p className="truncate text-sm font-semibold">
            {peer?.name ?? t("common.loading")}
          </p>
          {peer && (
            <p className="truncate text-xs text-muted-foreground">
              {peer.grade}
            </p>
          )}
        </Link>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {t("messages.emptyChat")}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.is_mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  message.is_mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={cn(
                    "mt-0.5 text-right text-[10px]",
                    message.is_mine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t p-3">
        {sendError && (
          <p className="mb-2 text-xs text-destructive">{sendError}</p>
        )}
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("messages.placeholder")}
            maxLength={2000}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || sendMutation.isPending}
            aria-label={t("messages.send")}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MessagesContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialPeerId = useMemo(() => {
    const raw = Number(searchParams.get("user"));
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }, [searchParams]);

  const [selectedPeerId, setSelectedPeerId] = useState<number | null>(
    initialPeerId
  );

  return (
    <div className="grid h-[calc(100vh-10.5rem)] min-h-[420px] gap-4 md:grid-cols-[300px_1fr]">
      <ConversationList
        selectedPeerId={selectedPeerId}
        onSelect={setSelectedPeerId}
        className={cn(selectedPeerId !== null && "hidden md:flex")}
      />
      {selectedPeerId !== null ? (
        <ChatPanel
          peerId={selectedPeerId}
          onBack={() => setSelectedPeerId(null)}
        />
      ) : (
        <Card className="hidden items-center justify-center md:flex">
          <div className="text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("messages.pick")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("messages.title")}
        </h1>
        <Suspense fallback={<Skeleton className="h-[60vh] w-full" />}>
          <MessagesContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
