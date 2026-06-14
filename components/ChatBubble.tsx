import type { ChatMessage } from "@/lib/types";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(message.createdAt));

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser ? (
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border-2 border-lime-400 bg-[#12351f] text-[#a8f56a]"
          aria-label="거북이 게임 마스터"
        >
          <span aria-hidden="true" className="text-xxl">
            🐢
          </span>
        </div>
      ) : null}
      {!isUser ? <time className="muted mb-1 text-[10px]">{time}</time> : null}
      <div
        className={`max-w-[72%] border-2 px-4 py-3 leading-6 shadow-lg ${isUser ? "rounded-l-lg rounded-tr-lg border-blue-300 bg-[#1853b8]" : "rounded-r-lg rounded-tl-lg border-lime-400 bg-[#102d24] text-[#c4ff91]"}`}
      >
        {message.content}
      </div>
      {isUser ? <time className="muted mb-1 text-[10px]">{time}</time> : null}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex items-end gap-2" aria-label="AI 답변 생성 중">
      <div className="grid h-10 w-10 place-items-center rounded-md border-2 border-lime-400 bg-[#12351f] text-[#a8f56a]">
        <span aria-hidden="true" className="text-xxl">
          🐢
        </span>
      </div>
      <div className="loading-dots rounded-r-lg rounded-tl-lg border-2 border-cyan-300 bg-[#0d2940] px-5 py-3 text-cyan-100" />
    </div>
  );
}
