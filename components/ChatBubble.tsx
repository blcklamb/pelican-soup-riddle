import type { ChatMessage } from "@/lib/types";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(message.createdAt));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-start gap-2">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#2a3824] bg-[#121a10] text-[#7aaa6a]"
              aria-label="거북이 게임 마스터"
            >
              <span aria-hidden="true" className="text-lg">
                🐢
              </span>
            </div>
            <div className="max-w-[72%] rounded-lg rounded-tl-none border border-[#253022] bg-[#121a10] px-4 py-3 leading-6 text-[#a8c49a]">
              {message.content}
            </div>
          </div>
          <time className="muted pl-11 text-[10px]">{time}</time>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[72%] rounded-lg rounded-tr-none border border-[#232342] bg-[#131320] px-4 py-3 leading-6 text-[#c0c0e4]">
            {message.content}
          </div>
          <time className="muted text-[10px]">{time}</time>
        </div>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex items-start gap-2" aria-label="AI 답변 생성 중">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#2a3824] bg-[#121a10] text-[#7aaa6a]">
        <span aria-hidden="true" className="text-lg">
          🐢
        </span>
      </div>
      <div className="loading-dots rounded-lg rounded-tl-none border border-[#253022] bg-[#121a10] px-5 py-3 text-[#62627a]" />
    </div>
  );
}
