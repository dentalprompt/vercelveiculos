import { findPublicCatalogItemBySlug } from "../src/admin/repository.js";

const SITE_ORIGIN = "https://www.vercelveiculosemaquinarios.com.br";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const getQueryParam = (req, key) => {
  if (req.query && typeof req.query === "object" && key in req.query) {
    return req.query[key];
  }
  return new URL(req.url || "/", SITE_ORIGIN).searchParams.get(key);
};

const sendPage = (res, statusCode, html) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.end(html);
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return sendPage(res, 405, "<!doctype html><title>Método não permitido</title>");
  }

  const slug = String(getQueryParam(req, "slug") || "").trim();
  if (!slug) return sendPage(res, 400, "<!doctype html><title>Veículo não informado</title>");

  try {
    const item = await findPublicCatalogItemBySlug(slug);
    if (!item) return sendPage(res, 404, "<!doctype html><title>Veículo não encontrado</title>");

    const title = `${item.title} | VERCEL VEÍCULOS E MAQUINÁRIOS`;
    const description = String(item.description || `${item.title} — ${item.category || "Veículo"}. Consulte preço e disponibilidade.`)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
    const images = Array.isArray(item.gallery_images) ? item.gallery_images : [];
    const imagePath = images[0] || item.image_url || "";
    const imageUrl = imagePath ? new URL(imagePath, `${SITE_ORIGIN}/`).href : "";
    const pageUrl = `${SITE_ORIGIN}/veiculo/${encodeURIComponent(item.slug)}`;
    const detailUrl = `${SITE_ORIGIN}/detalhe.html?slug=${encodeURIComponent(item.slug)}`;
    const price = Number(item.price) > 0
      ? Number(item.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Sob consulta";

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="VERCEL VEÍCULOS E MAQUINÁRIOS">
  <meta property="og:title" content="${escapeHtml(item.title)}">
  <meta property="og:description" content="Preço: ${escapeHtml(price)}. ${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}"><meta property="og:image:alt" content="${escapeHtml(item.title)}">` : ""}
  <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(detailUrl)}">
  <script>window.location.replace(${JSON.stringify(detailUrl)});</script>
</head>
<body><p>Abrindo ${escapeHtml(item.title)}… <a href="${escapeHtml(detailUrl)}">Ver veículo (${escapeHtml(price)})</a></p></body>
</html>`;

    return sendPage(res, 200, html);
  } catch (error) {
    console.error("Erro ao preparar prévia do veículo:", error);
    return sendPage(res, 500, "<!doctype html><title>Não foi possível carregar o veículo</title>");
  }
}
