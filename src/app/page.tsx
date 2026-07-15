import Link from "next/link";

const features = [
  {
    title: "刷题",
    desc: "上传材料，AI 自动出题。名词辨析、概念判断，像背单词一样刷专业课。",
    href: "/quiz",
    accent: "rose",
  },
  {
    title: "导图",
    desc: "自动生成知识脉络树。框框+连线，展开/收起，学科逻辑一目了然。",
    href: "/mindmap",
    accent: "sage",
  },
  {
    title: "热点",
    desc: "时事 × 专业材料，多角度拆解论述题。政府、企业、社会、法律——全方位透视。",
    href: "/hotspot",
    accent: "peach",
  },
  {
    title: "资料",
    desc: "管理文本、PDF、Word 材料。AI 加工的原点。",
    href: "/materials",
    accent: "lavender",
  },
];

const accentStyles: Record<string, { bg: string; border: string; dot: string }> = {
  rose: { bg: "bg-[var(--accent-rose-bg)]", border: "border-[var(--accent-rose)]/20", dot: "bg-[var(--accent-rose)]" },
  sage: { bg: "bg-[var(--accent-sage-bg)]", border: "border-[var(--accent-sage)]/20", dot: "bg-[var(--accent-sage)]" },
  peach: { bg: "bg-[var(--accent-peach-bg)]", border: "border-[var(--accent-peach)]/20", dot: "bg-[var(--accent-peach)]" },
  lavender: { bg: "bg-[var(--accent-lavender-bg)]", border: "border-[var(--accent-lavender)]/20", dot: "bg-[var(--accent-lavender)]" },
};

export default function Home() {
  return (
    <>
      {/* 装饰性背景圆 */}
      <div className="blob w-[400px] h-[400px] bg-[var(--accent-rose)] top-[-100px] right-[-100px]" />
      <div className="blob w-[300px] h-[300px] bg-[var(--accent-sage)] bottom-[200px] left-[-80px]" />
      <div className="blob w-[200px] h-[200px] bg-[var(--accent-lavender)] bottom-[-50px] right-[20%]" />

      <div className="max-w-5xl mx-auto px-5">
        {/* ─── Hero ─── */}
        <section className="pt-20 pb-12 text-center md:text-left">
          <div className="max-w-xl mx-auto md:mx-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-[var(--border-light)] text-[11px] text-[var(--text-secondary)] tracking-wider mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-rose)]" />
              文科考研 · AI 学习助手
            </span>
            <h1 className="text-[40px] md:text-[52px] font-light tracking-tight text-[var(--text)] leading-[1.1] mb-4">
              要义
              <br />
              <span className="font-medium">剪影</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 max-w-md">
              把你的教材交给 AI，自动生成选择题、知识脉络图和热点论述分析。
            </p>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Link
                href="/quiz"
                className="btn btn-primary"
              >
                开始刷题
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/materials"
                className="btn btn-ghost"
              >
                上传资料
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 功能卡片网格 (2×2) ─── */}
        <section className="pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => {
              const ac = accentStyles[f.accent];
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className="glass-card p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${ac.bg} border ${ac.border} flex items-center justify-center`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${ac.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[var(--text)] mb-1.5 tracking-wide">
                        {f.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── 流程 ─── */}
        <section className="pb-16">
          <div className="glass-card-static p-6">
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
              {[
                { num: "01", title: "上传", desc: "教材、笔记、真题" },
                { num: "02", title: "加工", desc: "AI 拆解，生成题库与知识网络" },
                { num: "03", title: "学习", desc: "刷题 · 导图 · 热点" },
              ].map((s) => (
                <div key={s.num} className="flex-1">
                  <span className="text-[11px] text-[var(--text-tertiary)] tracking-[0.2em]">{s.num}</span>
                  <h3 className="text-sm font-medium text-[var(--text)] mt-1 mb-0.5">{s.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 页脚 ─── */}
        <footer className="border-t border-[var(--border-light)] py-6 mb-8">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] tracking-wider">
            <span>要义剪影</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[var(--accent-rose)]" />
              <span className="w-1 h-1 rounded-full bg-[var(--accent-sage)]" />
              <span className="w-1 h-1 rounded-full bg-[var(--accent-lavender)]" />
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
