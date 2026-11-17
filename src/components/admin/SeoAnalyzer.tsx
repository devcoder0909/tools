import { useState, useMemo } from 'preact/hooks';
import { runYoastAudit, type SeoAuditInput } from '../../utils/seo-engine';

export interface PageAuditItem {
  slug: string;
  name: string;
  url: string;
  title: string;
  metaDescription: string;
  focusKeyword: string;
  canonical: string;
  h1: string;
  content: string;
}

interface Props {
  presetPages?: PageAuditItem[];
}

export default function SeoAnalyzer({ presetPages = [] }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string>(presetPages[0]?.slug || 'custom');
  const [title, setTitle] = useState<string>(presetPages[0]?.title || '');
  const [metaDescription, setMetaDescription] = useState<string>(presetPages[0]?.metaDescription || '');
  const [focusKeyword, setFocusKeyword] = useState<string>(presetPages[0]?.focusKeyword || '');
  const [slug, setSlug] = useState<string>(presetPages[0]?.slug || '');
  const [canonical, setCanonical] = useState<string>(presetPages[0]?.canonical || 'https://zixtool.online/');
  const [h1, setH1] = useState<string>(presetPages[0]?.h1 || '');
  const [content, setContent] = useState<string>(presetPages[0]?.content || '');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'all' | 'bad' | 'ok' | 'good'>('all');

  // Handle page change from preset dropdown
  const handlePageSelect = (targetSlug: string) => {
    setSelectedSlug(targetSlug);
    const page = presetPages.find((p) => p.slug === targetSlug);
    if (page) {
      setTitle(page.title);
      setMetaDescription(page.metaDescription);
      setFocusKeyword(page.focusKeyword);
      setSlug(page.slug);
      setCanonical(page.canonical);
      setH1(page.h1);
      setContent(page.content);
    }
  };

  // Run audit in real-time
  const auditReport = useMemo(() => {
    const input: SeoAuditInput = {
      url: canonical,
      slug,
      title,
      metaDescription,
      focusKeyword,
      canonical,
      h1,
      headings: [
        { level: 1, text: h1 },
        { level: 2, text: 'How to use' },
        { level: 2, text: 'Technical Specifications' },
        { level: 3, text: 'Supported Formats' },
      ],
      content,
      images: [
        { src: `/images/tools/${slug}-workflow.svg`, alt: `${title} Architecture Diagram` },
      ],
      internalLinks: [
        { href: '/' },
        { href: '/tools/' },
        { href: '/image-compressor/' },
        { href: '/pdf-to-jpg/' },
        { href: '/privacy-explained/' },
        { href: '/formats/' },
      ],
      outboundLinks: [],
      jsonLdSchemas: [{ '@type': 'WebApplication' }, { '@type': 'BreadcrumbList' }],
    };

    return runYoastAudit(input);
  }, [title, metaDescription, focusKeyword, slug, canonical, h1, content]);

  const filteredChecks = useMemo(() => {
    if (activeTab === 'all') return auditReport.checks;
    return auditReport.checks.filter((c) => c.status === activeTab);
  }, [auditReport, activeTab]);

  return (
    <div class="space-y-8 font-sans">
      {/* Top Header Card with Scores */}
      <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Yoast SEO Architecture
              </span>
              <span class="text-xs text-slate-500 font-mono">Real-time Quality Gates</span>
            </div>
            <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">
              Real-Time SEO &amp; Readability Analyzer
            </h2>
            <p class="text-sm text-slate-600 mt-1 max-w-2xl">
              Audit live pages or test editorial drafts. Evaluates title, description, keyphrase density, heading hierarchy, Flesch readability, and SERP CTR potential.
            </p>
          </div>

          {/* Quick Page Selector */}
          {presetPages.length > 0 && (
            <div class="w-full md:w-72">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Audit Existing Page
              </label>
              <select
                value={selectedSlug}
                onChange={(e: any) => handlePageSelect(e.target.value)}
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-medium"
              >
                {presetPages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} (/{p.slug}/)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Score Badges Grid */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {/* Overall SEO Indicator */}
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3.5">
            <div
              class={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-sm ${
                auditReport.status === 'good'
                  ? 'bg-emerald-600'
                  : auditReport.status === 'ok'
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            >
              {auditReport.overallScore}
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Score</div>
              <div class="text-sm font-bold text-slate-800 capitalize">
                {auditReport.status === 'good' ? '🟢 Optimized' : auditReport.status === 'ok' ? '🟡 Acceptable' : '🔴 Needs Attention'}
              </div>
            </div>
          </div>

          {/* Keyphrase Density */}
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              {auditReport.keywordDensity}%
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">KW Density</div>
              <div class="text-sm font-bold text-slate-800">
                {auditReport.keywordCount} occurrence(s)
              </div>
            </div>
          </div>

          {/* Flesch Reading Ease */}
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
              {auditReport.readingEaseScore}
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Readability</div>
              <div class="text-sm font-bold text-slate-800">
                {auditReport.readingEaseText}
              </div>
            </div>
          </div>

          {/* Word Count */}
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-sm">
              {auditReport.wordCount}
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Word Count</div>
              <div class="text-sm font-bold text-slate-800">
                {auditReport.wordCount >= 250 ? '🟢 Meets Minimum' : '🔴 Thin Content'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Editor on Left, Live SERP Preview & Diagnostics on Right */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Content Editor (5 cols) */}
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>On-Page Inputs</span>
              <span class="text-2xs font-semibold text-slate-400">Live Auto-Evaluation</span>
            </h3>

            {/* Focus Keyphrase */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Focus Keyphrase *
                </label>
                <span class="text-2xs text-slate-400 font-mono">e.g. passport photo resizer</span>
              </div>
              <input
                type="text"
                value={focusKeyword}
                onInput={(e: any) => setFocusKeyword(e.target.value)}
                placeholder="Enter primary target keyword..."
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
              />
            </div>

            {/* SEO Title */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SEO Title
                </label>
                <span class={`text-2xs font-mono font-bold ${title.length >= 30 && title.length <= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {title.length} / 60 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onInput={(e: any) => setTitle(e.target.value)}
                placeholder="Title (30-60 chars)..."
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
              />
              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  class={`h-full transition-all ${
                    title.length < 30
                      ? 'bg-amber-400'
                      : title.length <= 60
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (title.length / 60) * 100)}%` }}
                />
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Meta Description
                </label>
                <span class={`text-2xs font-mono font-bold ${metaDescription.length >= 115 && metaDescription.length <= 165 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metaDescription.length} / 160 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onInput={(e: any) => setMetaDescription(e.target.value)}
                placeholder="Meta description (120-158 characters recommended)..."
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium leading-relaxed"
              />
              <div class="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  class={`h-full transition-all ${
                    metaDescription.length < 115
                      ? 'bg-amber-400'
                      : metaDescription.length <= 165
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (metaDescription.length / 165) * 100)}%` }}
                />
              </div>
            </div>

            {/* URL Slug & H1 Heading */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onInput={(e: any) => setSlug(e.target.value)}
                  placeholder="e.g. merge-pdf"
                  class="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  H1 Heading
                </label>
                <input
                  type="text"
                  value={h1}
                  onInput={(e: any) => setH1(e.target.value)}
                  placeholder="Primary H1..."
                  class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Body Content / Editorial Draft */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Page Content / Editorial Copy
                </label>
                <span class="text-2xs text-slate-500 font-mono">{content.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea
                rows={8}
                value={content}
                onInput={(e: any) => setContent(e.target.value)}
                placeholder="Paste or write body text to check keyphrase density, paragraph length, and Flesch readability..."
                class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Google SERP Preview & Yoast Traffic Lights (7 cols) */}
        <div class="lg:col-span-7 space-y-6">
          {/* Live Google SERP Snippet Preview */}
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Google SERP Snippet Preview
                </h3>
              </div>
              <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  class={`px-3 py-1 rounded-md transition ${previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  class={`px-3 py-1 rounded-md transition ${previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Google Result Simulator Box */}
            <div class={`p-4 rounded-xl border border-slate-200/60 bg-white ${previewDevice === 'mobile' ? 'max-w-md mx-auto shadow-sm' : ''}`}>
              <div class="flex items-center gap-2 mb-1.5">
                <div class="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-emerald-600">
                  Z
                </div>
                <div>
                  <div class="text-xs font-medium text-slate-800 leading-tight">ZixTool</div>
                  <div class="text-2xs text-slate-500 font-mono truncate max-w-sm">
                    {canonical || `https://zixtool.online/${slug}/`}
                  </div>
                </div>
              </div>

              <div class="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1 mb-1 font-sans">
                {title || 'Page Title | ZixTool'}
              </div>

              <div class="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {metaDescription || 'Add a comprehensive meta description between 120 and 158 characters to attract clicks in Google Search.'}
              </div>
            </div>
          </div>

          {/* Traffic Light Diagnostics Accordion */}
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Yoast Diagnostic Checks</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {auditReport.checks.length}
                </span>
              </h3>

              {/* Status Filter Buttons */}
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  class={`px-2.5 py-1 rounded-lg transition ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  All ({auditReport.checks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bad')}
                  class={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${activeTab === 'bad' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                >
                  <span>🔴</span> Errors ({auditReport.badCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ok')}
                  class={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${activeTab === 'ok' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                >
                  <span>🟡</span> Warnings ({auditReport.okCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('good')}
                  class={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${activeTab === 'good' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                >
                  <span>🟢</span> Good ({auditReport.goodCount})
                </button>
              </div>
            </div>

            {/* Checklist Items */}
            <div class="space-y-3">
              {filteredChecks.map((check) => (
                <div
                  key={check.id}
                  class={`p-4 rounded-xl border transition ${
                    check.status === 'good'
                      ? 'border-emerald-200/70 bg-emerald-50/20'
                      : check.status === 'ok'
                      ? 'border-amber-200/70 bg-amber-50/20'
                      : 'border-rose-200/70 bg-rose-50/20'
                  }`}
                >
                  <div class="flex items-start gap-3">
                    <span class="text-base mt-0.5">
                      {check.status === 'good' ? '🟢' : check.status === 'ok' ? '🟡' : '🔴'}
                    </span>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-bold text-slate-900">{check.title}</h4>
                        {check.metric && (
                          <span class="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {check.metric}
                          </span>
                        )}
                      </div>
                      <p class="text-xs text-slate-700 mt-0.5">{check.message}</p>

                      {/* 3 Explicit Diagnostic Fields (What is wrong, Why it matters, How to fix it) */}
                      {(check.whatIsWrong || check.whyItMatters || check.howToFix) && (
                        <div class="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-2xs">
                          {check.whatIsWrong && (
                            <div class="bg-white/80 p-2.5 rounded-lg border border-slate-200/50">
                              <span class="font-bold text-rose-700 uppercase tracking-wider block mb-1">
                                1. What is Wrong
                              </span>
                              <span class="text-slate-600 leading-normal">{check.whatIsWrong}</span>
                            </div>
                          )}
                          {check.whyItMatters && (
                            <div class="bg-white/80 p-2.5 rounded-lg border border-slate-200/50">
                              <span class="font-bold text-amber-700 uppercase tracking-wider block mb-1">
                                2. Why it Matters
                              </span>
                              <span class="text-slate-600 leading-normal">{check.whyItMatters}</span>
                            </div>
                          )}
                          {check.howToFix && (
                            <div class="bg-white/80 p-2.5 rounded-lg border border-slate-200/50">
                              <span class="font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                3. How to Fix
                              </span>
                              <span class="text-slate-600 leading-normal">{check.howToFix}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredChecks.length === 0 && (
                <div class="p-8 text-center text-sm text-slate-500">
                  No checks matching the selected filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
