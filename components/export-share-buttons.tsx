"use client";

import { useState } from "react";
import { Download, Share2, Twitter, Linkedin, MessageCircle, Copy, FileText } from "lucide-react";
import type { ProductEvaluation } from "@/types";
import {
  exportToPDF,
  generatePDFBlob,
  generateTwitterShareURL,
  generateLinkedInShareURL,
  generateWhatsAppShareURL,
  generateSocialMediaSummary,
  copyToClipboard,
} from "@/lib/pdf-export";

interface ExportShareButtonsProps {
  evaluation: ProductEvaluation;
  elementId: string; // ID of the element to export as PDF
}

export function ExportShareButtons({ evaluation, elementId }: ExportShareButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Element not found");
      }

      const filename = `product-evaluation-${evaluation.url.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`;

      await exportToPDF(element, {
        filename,
        quality: 0.95,
        scale: 2,
      });

      // Success feedback
      alert("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySummary = async () => {
    const summary = generateSocialMediaSummary(evaluation);
    const success = await copyToClipboard(summary);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSharePDFWhatsApp = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Element not found");
      }

      const filename = `product-evaluation-${evaluation.url.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.pdf`;

      // Detect if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // On desktop (including macOS), always use the reliable fallback method
      // This avoids the "user gesture expired" timing issue
      if (!isMobile) {
        console.log('Desktop detected, using download + WhatsApp web fallback');

        // Download PDF
        await exportToPDF(element, { filename });

        // Open WhatsApp with message
        const whatsappURL = generateWhatsAppShareURL(evaluation);
        window.open(whatsappURL, "_blank", "width=600,height=400");

        alert("PDF downloaded! You can now attach it in WhatsApp.");
        setShowShareMenu(false);
        setIsExporting(false);
        return;
      }

      // On mobile, try Web Share API first (works better on mobile)
      if (navigator.share && navigator.canShare) {
        try {
          // Generate PDF as Blob
          const { blob, filename: pdfFilename } = await generatePDFBlob(element, { filename });

          // Create File object from Blob
          const file = new File([blob], pdfFilename, { type: 'application/pdf' });
          const summary = generateSocialMediaSummary(evaluation);

          const shareData = {
            files: [file],
            title: 'Product Evaluation Report',
            text: summary,
          };

          // Check if this specific data can be shared
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            console.log('✅ PDF shared successfully via Web Share API');
            setShowShareMenu(false);
            setIsExporting(false);
            return;
          }
        } catch (shareError) {
          console.warn('Web Share API failed, using fallback:', shareError);
          // Fall through to fallback method
        }
      }

      // Fallback for mobile if Web Share API fails
      console.log('Using fallback: download + WhatsApp');
      await exportToPDF(element, { filename });

      // Open WhatsApp with message
      const whatsappURL = generateWhatsAppShareURL(evaluation);
      window.open(whatsappURL, "_blank", "width=600,height=400");

      alert("PDF downloaded! You can now attach it in WhatsApp.");
    } catch (error) {
      console.error("WhatsApp share error:", error);
      alert("Failed to share. Please try downloading the PDF instead.");
    } finally {
      setIsExporting(false);
      setShowShareMenu(false);
    }
  };

  const handleShare = (platform: "twitter" | "linkedin" | "whatsapp") => {
    if (platform === "whatsapp") {
      handleSharePDFWhatsApp();
      return;
    }

    let url = "";
    switch (platform) {
      case "twitter":
        url = generateTwitterShareURL(evaluation);
        break;
      case "linkedin":
        url = generateLinkedInShareURL(evaluation);
        break;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  return (
    <div className="relative w-full flex flex-col items-center gap-6 py-8">
      {/* Action Buttons */}
      <div className="relative flex flex-col sm:flex-row gap-4 items-center justify-center">
        {/* Share Menu */}
        {showShareMenu && (
          <div className="absolute bottom-full mb-4 bg-white dark:bg-neutral-900 border-2 border-blue-500 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="text-sm font-semibold text-black dark:text-white mb-3">
              Share Report
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-sm font-medium">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("linkedin")}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">WhatsApp</span>
              </button>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                <Copy className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {copied ? "Copied!" : "Copy Summary"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Info Text */}
      <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        <FileText className="w-3 h-3 inline mr-1" />
        Export or share this report
      </div>
    </div>
  );
}
