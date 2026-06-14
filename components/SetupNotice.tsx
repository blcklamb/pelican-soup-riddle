import { Settings } from "lucide-react";

export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="app-shell flex items-center">
      <section className="pixel-panel w-full p-7 text-center">
        <Settings className="mx-auto mb-4 text-cyan-200" aria-hidden="true" size={48} strokeWidth={1.7} />
        <p className="eyebrow mb-2">System offline</p>
        <h1 className="mb-4 text-2xl font-black">서비스 연결이 필요합니다</h1>
        <p className="muted mb-5 leading-7">Supabase와 OpenAI 환경변수를 설정한 뒤 서버를 다시 시작해주세요.</p>
        <ul className="mx-auto max-w-sm space-y-2 text-left text-sm text-[#bfefff]">
          {missing.map((key) => <li key={key} className="rounded bg-black/25 px-3 py-2">{key}</li>)}
        </ul>
        <p className="muted mt-5 text-xs"><code>.env.example</code>을 참고하세요.</p>
      </section>
    </main>
  );
}
