export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const apkUrl = 'https://files.catbox.moe/apydv7.apk';
    const apkRes = await fetch(apkUrl);

    if (!apkRes.ok) {
      return new Response('Failed to fetch APK file.', { status: 500 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.android.package-archive');
    headers.set('Content-Disposition', 'attachment; filename="ZenBudget.apk"');
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');

    return new Response(apkRes.body, {
      status: 200,
      headers: headers,
    });
  } catch (err) {
    return new Response('Download error: ' + err.message, { status: 500 });
  }
}
