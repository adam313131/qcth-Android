/*
 * Copyright © 2016 Zhenjie Yan.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.yanzhenjie.andserver.sample;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Created by Zhenjie Yan on 2018/6/9.
 */
public class MainActivity extends AppCompatActivity {

    private ServerManager mServerManager;
    private WebView mWebView;
    private String mRootUrl;
    private String mPublicUrl;
    private FloatingActionButton mFabShare;
    private LinearLayout mServerStoppedLayout;
    private Button mBtnStartServer;
    private ImageView mIvLoading;
    private TextView mTvServerStatus;
    private Animation mRotateAnimation;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN);
        // For devices with notches or camera holes, allow content to be drawn into the display cutout area.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        // Prevent bottom buttons from moving up.
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN | WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
        setContentView(R.layout.activity_main);

        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        mWebView = findViewById(R.id.webView);
        setupWebView(mWebView);

        mWebView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimetype);
            String cookies = CookieManager.getInstance().getCookie(url);
            request.addRequestHeader("cookie", cookies);
            request.addRequestHeader("User-Agent", userAgent);
            request.setDescription("Downloading file...");
            request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype));
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype));
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            dm.enqueue(request);
            Toast.makeText(getApplicationContext(), "Downloading File", Toast.LENGTH_LONG).show();
        });

        mFabShare = findViewById(R.id.fab_share);
        mFabShare.setVisibility(View.GONE);
        mFabShare.setOnClickListener(view -> {
            String currentWebViewUrl = mWebView.getUrl();
            if (TextUtils.isEmpty(currentWebViewUrl)) {
                Toast.makeText(getApplicationContext(), "Current URL not available.", Toast.LENGTH_SHORT).show();
                return;
            }

            String baseShareUrl = !TextUtils.isEmpty(mPublicUrl) ? mPublicUrl : mRootUrl;
            if (baseShareUrl == null) {
                baseShareUrl = currentWebViewUrl;
            }

            try {
                URL shareUrlBase = new URL(baseShareUrl);
                URL currentUrl = new URL(currentWebViewUrl);

                URL finalUrl = new URL(shareUrlBase.getProtocol(), shareUrlBase.getHost(), shareUrlBase.getPort(), currentUrl.getFile());

                Intent sendIntent = new Intent();
                sendIntent.setAction(Intent.ACTION_SEND);
                sendIntent.putExtra(Intent.EXTRA_TEXT, finalUrl.toString());
                sendIntent.setType("text/plain");
                startActivity(Intent.createChooser(sendIntent, "分享"));
            } catch (MalformedURLException e) {
                Log.e("MainActivity", "Failed to create shareable URL.", e);
                Toast.makeText(getApplicationContext(), "Failed to create shareable URL.", Toast.LENGTH_SHORT).show();
            }
        });

        mServerStoppedLayout = findViewById(R.id.layout_server_stopped);
        mBtnStartServer = findViewById(R.id.btn_start_server);
        mIvLoading = findViewById(R.id.iv_loading);
        mTvServerStatus = findViewById(R.id.tv_server_status);

        mRotateAnimation = AnimationUtils.loadAnimation(this, R.anim.rotate);

        mBtnStartServer.setOnClickListener(v -> {
            showLoading();
            mServerManager.startServer();
        });

        // AndServer run in the service.
        mServerManager = new ServerManager(this);
        mServerManager.register();
        mServerManager.startServer();
        showLoading();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (mWebView.canGoBack()) {
                    mWebView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    @SuppressLint({"SetJavaScriptEnabled", "ObsoleteSdkInt"})
    private void setupWebView(WebView webView) {
        WebSettings webSettings = webView.getSettings();

        // Enable JavaScript and Cookies.
        webSettings.setJavaScriptEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        // Enable storage.
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setAppCachePath(getApplicationContext().getCacheDir().getAbsolutePath());

        // Enable file access.
        webSettings.setAllowFileAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            webSettings.setAllowFileAccessFromFileURLs(true);
            webSettings.setAllowUniversalAccessFromFileURLs(true);
        }
        
        // Caching.
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hide scrollbars.
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        webView.setWebViewClient(new WebViewClient());
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mServerManager.unRegister();
    }

    private void showLoading() {
        mWebView.setVisibility(View.GONE);
        mServerStoppedLayout.setVisibility(View.VISIBLE);
        mTvServerStatus.setVisibility(View.GONE);
        mIvLoading.setVisibility(View.VISIBLE);
        mIvLoading.startAnimation(mRotateAnimation);
        mBtnStartServer.setVisibility(View.GONE);
    }

    private void showServerStarted() {
        mWebView.setVisibility(View.VISIBLE);
        mServerStoppedLayout.setVisibility(View.GONE);
        mIvLoading.clearAnimation();
    }

    private void showServerStopped(String status) {
        mWebView.setVisibility(View.GONE);
        mServerStoppedLayout.setVisibility(View.VISIBLE);
        mTvServerStatus.setText(status);
        mTvServerStatus.setVisibility(View.VISIBLE);
        mIvLoading.setVisibility(View.GONE);
        mIvLoading.clearAnimation();
        mBtnStartServer.setVisibility(View.VISIBLE);
    }

    /**
     * Start notify.
     */
    public void onServerStart(String localIp, String publicIp, boolean isPublicIPv6, int port) {
        showServerStarted();

        if (port == -1) {
            onServerError("Failed to start server. Invalid port.");
            return;
        }

        if (!TextUtils.isEmpty(localIp)) {
            mRootUrl = "http://127.0.0.1:" + port + "/";
            mWebView.loadUrl(mRootUrl);
        } else {
            mRootUrl = null;
            mWebView.loadData("<html><body><h1>Server IP Error</h1></body></html>", "text/html", "UTF-8");
        }

        if(isPublicIPv6 && !TextUtils.isEmpty(publicIp)) {
            mPublicUrl = "http://[" + publicIp + "]" + ":" + port + "/";
            mFabShare.setVisibility(View.VISIBLE);
        } else {
            mPublicUrl = null;
            mFabShare.setVisibility(View.GONE);
        }

        checkAppUpdate();
    }

    /**
     * Error notify.
     */
    public void onServerError(String message) {
        mRootUrl = null;
        mPublicUrl = null;
        mFabShare.setVisibility(View.GONE);
        showServerStopped("Server Error: " + message);
    }

    /**
     * Stop notify.
     */
    public void onServerStop() {
        mRootUrl = null;
        mPublicUrl = null;
        mFabShare.setVisibility(View.GONE);
        showServerStopped("Server Stopped");
    }

    private void checkAppUpdate() {
        new Thread(() -> {
            try {
                URL url = new URL("https://checkappv.aliyuns.dpdns.org/qcth.json");
                HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
                try {
                    BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(urlConnection.getInputStream()));
                    StringBuilder stringBuilder = new StringBuilder();
                    String line;
                    while ((line = bufferedReader.readLine()) != null) {
                        stringBuilder.append(line);
                    }
                    bufferedReader.close();
                    String jsonString = stringBuilder.toString();
                    JSONObject jsonObject = JSON.parseObject(jsonString);
                    String newVersion = jsonObject.getString("appv");
                    String appUrl = jsonObject.getString("appurl");

                    String currentVersion = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;

                    if (!currentVersion.equals(newVersion)) {
                        new Handler(Looper.getMainLooper()).post(() -> 
                            new AlertDialog.Builder(MainActivity.this)
                                    .setTitle("发现新版本")
                                    .setMessage("请安装更新")
                                    .setPositiveButton("确定", (dialog, which) -> {
                                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(appUrl));
                                        request.setMimeType("application/vnd.android.package-archive");
                                        request.setDescription("Downloading new version...");
                                        request.setTitle("qcth.apk");
                                        request.allowScanningByMediaScanner();
                                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "qcth.apk");
                                        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                                        dm.enqueue(request);
                                        Toast.makeText(getApplicationContext(), "开始下载新版本", Toast.LENGTH_LONG).show();
                                    })
                                    .setNegativeButton("下次", null)
                                    .show());
                    }
                } finally {
                    urlConnection.disconnect();
                }
            } catch (Exception e) {
                Log.e("MainActivity", "checkAppUpdate failed", e);
            }
        }).start();
    }
}
