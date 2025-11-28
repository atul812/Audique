import { motion } from "motion/react";
import { FileText, Download, Copy, Check, Sparkles, Clock, BookOpen } from "lucide-react";
import { useState } from "react";

const mockSummary = {
  title: "Lecture Summary",
  date: "Unknown date",
  duration: "",
  summary:
    "No summary generated yet. Click 'Generate Summary' to create an AI summary from your transcript.",
};

export function SummaryView({ hasData, summary, onSummarize, isSummarizing, onDownloadPdf }) {
  const [copied, setCopied] = useState(false);

  const effectiveSummary =
    hasData && summary && summary.trim().length > 0 ? summary : mockSummary.summary;

  const handleCopy = () => {
    navigator.clipboard.writeText(effectiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <div className="relative max-w-2xl mx-auto">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-3xl opacity-20" />
          <div className="relative p-16 bg-white/5 backdrop-blur-2xl border-2 border-dashed border-white/20 rounded-3xl">
            <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-xl text-gray-300 mb-2">No summary available</p>
            <p className="text-gray-500">Record and transcribe audio to generate a summary</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // build key points from summary if it has bullet points, else simple split
  const keyPoints = effectiveSummary
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => (line.startsWith("•") ? line.slice(1).trim() : line));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <motion.div
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

        <div className="relative p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <motion.div
                className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <FileText className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <h2 className="text-3xl text-white mb-2">{mockSummary.title}</h2>
                <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {mockSummary.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {mockSummary.duration || "Dynamic AI summary"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <motion.button
                onClick={onSummarize}
                disabled={isSummarizing}
                className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: isSummarizing ? 1 : 1.05 }}
                whileTap={{ scale: isSummarizing ? 1 : 0.95 }}
              >
                {isSummarizing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleCopy}
                className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={onDownloadPdf}
                disabled={!summary}
                className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: summary ? 1.05 : 1 }}
                whileTap={{ scale: summary ? 0.95 : 1 }}
              >
                <Download className="w-4 h-4" />
                PDF
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <motion.div
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

          <div className="relative p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl">
            <h3 className="text-2xl text-white mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              Key Points
            </h3>

            <div className="space-y-4">
              {keyPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex gap-4 group/item"
                >
                  <motion.div
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white relative overflow-hidden"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                      style={{ opacity: 0.2 }}
                    />
                    <span className="relative z-10">{index + 1}</span>
                  </motion.div>

                  <motion.p className="flex-1 text-gray-300 leading-relaxed pt-1 group-hover/item:text-white transition-colors duration-300">
                    {point}
                  </motion.p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Summary */}
      <motion.div
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

        <div className="relative p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl">
          <h3 className="text-2xl text-white mb-6 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            Full Summary
          </h3>

          <div className="space-y-6">
            {effectiveSummary
              .split("\n\n")
              .map((paragraph, index) => paragraph.trim())
              .filter((p) => p.length > 0)
              .map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-lg text-gray-300 leading-relaxed hover:text-white transition-colors duration-300 whitespace-pre-wrap"
                >
                  {paragraph}
                </motion.p>
              ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
