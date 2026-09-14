package com.zenbudget.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    private String pendingSharedData = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSendIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSendIntent(intent);
    }

    private void handleSendIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            try {
                final JSONObject payload = new JSONObject();
                if (type.startsWith("image/")) {
                    Uri imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                    if (imageUri != null) {
                        InputStream inputStream = getContentResolver().openInputStream(imageUri);
                        if (inputStream != null) {
                            ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream();
                            byte[] buffer = new byte[4096];
                            int len;
                            while ((len = inputStream.read(buffer)) != -1) {
                                byteBuffer.write(buffer, 0, len);
                            }
                            inputStream.close();
                            byte[] imageBytes = byteBuffer.toByteArray();
                            String base64Image = Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                            String mime = type.contains("png") ? "image/png" : "image/jpeg";
                            payload.put("type", "image");
                            payload.put("data", "data:" + mime + ";base64," + base64Image);
                        }
                    }
                } else if (type.startsWith("text/")) {
                    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                    if (sharedText != null) {
                        payload.put("type", "text");
                        payload.put("data", sharedText);
                    }
                }

                if (payload.length() > 0) {
                    pendingSharedData = payload.toString();
                    sendPayloadToWebView(pendingSharedData);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void sendPayloadToWebView(final String jsonPayload) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        final WebView webView = getBridge().getWebView();
        webView.post(new Runnable() {
            @Override
            public void run() {
                String js = "window.__PENDING_SHARED_INTENT__ = " + jsonPayload + "; " +
                            "if (window.handleIncomingSharedContent) { " +
                            "   window.handleIncomingSharedContent(" + jsonPayload + "); " +
                            "}";
                webView.evaluateJavascript(js, null);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingSharedData != null) {
            sendPayloadToWebView(pendingSharedData);
        }
    }
}
