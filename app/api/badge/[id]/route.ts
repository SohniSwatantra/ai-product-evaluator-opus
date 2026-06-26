import { getEvaluationById } from "@/lib/db";

/**
 * Tier 2: Embeddable AX score badge (shields-style SVG).
 * GET /api/badge/[id]?metric=ax|anps
 *
 * Usage:  ![AX score](https://yourapp.com/api/badge/123)
 */

function color(score: number): string {
  if (score >= 75) return "#3fb950"; // green
  if (score >= 50) return "#d4a72c"; // amber
  return "#e5534b"; // red
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}

function badgeSvg(label: string, value: string, valueColor: string): string {
  // Rough character-width estimate (6.5px per char) keeps the layout tidy.
  const labelW = Math.max(34, label.length * 6.5 + 12);
  const valueW = Math.max(30, value.length * 6.5 + 14);
  const total = labelW + valueW;
  const l = escapeXml(label);
  const v = escapeXml(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${l}: ${v}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${valueColor}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="15" fill="#010101" fill-opacity=".3">${l}</text>
    <text x="${labelW / 2}" y="14">${l}</text>
    <text x="${labelW + valueW / 2}" y="15" fill="#010101" fill-opacity=".3">${v}</text>
    <text x="${labelW + valueW / 2}" y="14">${v}</text>
  </g>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get("metric") || "ax";

  const headers = {
    "Content-Type": "image/svg+xml",
    // Cache at the CDN for an hour; badges don't need to be real-time.
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };

  const evaluationId = parseInt(id);
  let svg: string;

  if (isNaN(evaluationId)) {
    svg = badgeSvg("AX score", "invalid", "#9f9f9f");
    return new Response(svg, { headers, status: 400 });
  }

  try {
    const evaluation = await getEvaluationById(evaluationId);
    const ax = evaluation?.agentExperience;
    if (!ax) {
      svg = badgeSvg("AX score", "n/a", "#9f9f9f");
      return new Response(svg, { headers });
    }

    if (metric === "anps") {
      const v = ax.anps;
      svg = badgeSvg("ANPS", `${v > 0 ? "+" : ""}${v}`, color((v + 100) / 2));
    } else {
      svg = badgeSvg("Agent Experience", `${ax.axScore}/100`, color(ax.axScore));
    }
    return new Response(svg, { headers });
  } catch (error) {
    console.error("Badge error:", error);
    svg = badgeSvg("AX score", "error", "#9f9f9f");
    return new Response(svg, { headers, status: 500 });
  }
}
