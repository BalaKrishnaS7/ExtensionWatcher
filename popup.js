// popup.js — REFACTORED FOR MODULARITY
// ==================================================

/**
 * Main application module, wrapped in an IIFE (Immediately Invoked Function Expression)
 * to prevent polluting the global scope.
 */
const xtnMonitor = (() => {
  "use strict";

  // ==================================================
  // I. CONFIG (Static Data)
  // ==================================================
  const config = {
    // Source for the dynamic store of verified extensions.
    // These IDs are for popular, trusted extensions.
    verifiedExtensionIDs: [
      "ddkjiahejlhfcafbddmgiahcphecmpfh", // uBlock Origin Lite
      "nngceckbapebfimnlniiiahkandclblb", // Bitwarden
      "eimadpbcbfnmbkopoojfekhnkhdbieeh", // Dark Reader
      "bnomihfieiccainjcjblhegjgglakjdd", // Improved Tube (Enhancer for YouTube)
      "pkehgijcmpdhfbdbbnkijodmdjhbjlgp", // Privacy Badger
      "fgmjlmbojbkmdpofahffgcpkhkngfpef", // Ghostery
      "cjpalhdlnbpafiamejdnhcphjbkeiagm", // uBlock Origin
      "gcbommkclmclpchllfjekcdonpmejbdp", // HTTPS Everywhere
    ],

    // Permission risk weights
    // Weights are based on security research. 100 is max risk.
    permissionRiskWeights: {
      // --- System-Level Access (Highest Risk) ---
      nativeMessaging: 100, // Can execute local software, bypassing sandbox.
      debugger: 95, // Can inspect, control, and modify all page behavior.
      webAuthenticationProxy: 90, // Can intercept security key (WebAuthn) requests.
      proxy: 90, // Can intercept and redirect all network traffic.
      vpnProvider: 90, // Can intercept and redirect all network traffic.

      // --- Broad Data Access (Very High Risk) ---
      scripting: 85, // Can inject arbitrary code into pages.
      userScripts: 85, // Can inject arbitrary code into pages.
      webRequestBlocking: 85, // Can block, redirect, or modify network requests.
      webRequest: 80, // Can *observe* all network traffic (passwords, data).
      clipboardRead: 80, // Can read your clipboard (passwords, crypto keys).
      cookies: 75, // Can read/write cookies (session hijacking).
      identity_email: 75, // Can get your email address.
      identity: 70, // Can get your auth tokens.
      history: 70, // Can read your entire browsing history.
      pageCapture: 70, // Can save/read a full snapshot of a page.
      tabCapture: 70, // Can record audio/video from a tab.
      desktopCapture: 70, // Can record your entire screen.
      "<all_urls>": 70, // Grants access to all websites.
      "*://*/*": 70, // Grants access to all websites.

      // --- Moderate Risk / Feature-Specific ---
      fileSystemProvider: 65, // Can create virtual file systems.
      sessions: 65, // Can access your open tabs and browsing sessions.
      downloads: 60, // Can initiate and manage downloads.
      downloads_open: 60, // Can open downloaded files.
      geolocation: 60, // Can access your precise physical location.
      topSites: 55, // Can read your most-visited sites.
      management: 50, // Can manage (disable/uninstall) other extensions.
      clipboardWrite: 50, // Can write to your clipboard.
      bookmarks: 45, // Can read/write your bookmarks.
      privacy: 45, // Can read/write your privacy settings.
      contentSettings: 45, // Can change site-specific settings (e.g., block JS).
      tabs: 40, // Can see URLs/titles of all open tabs (but not content).
      searchProvider: 40,
      declarativeNetRequestWithHostAccess: 40, // Safer 'webRequest' + host access.
      declarativeNetRequest: 35, // Safe, rule-based request blocking (e.g., ad blockers).

      // --- Low Risk / Utility ---
      system_cpu: 30,
      system_memory: 30,
      system_storage: 30,
      readingList: 25,
      browsingData: 25, // Can clear your browsing data.
      webNavigation: 20, // Can monitor page navigation events.
      storage: 15, // Standard local storage.
      unlimitedStorage: 15, // Bypasses 5MB storage limit.
      idle: 15,
      notifications: 10,
      alarms: 5,
      contextMenus: 5,
      sidePanel: 5,

      // --- Special Case ---
      activeTab: 0, // No risk. Temporary, user-invoked access.

      // --- Default for unrecognized or new permissions ---
      unknown: 50,
      // --- Weight for a single, specific host permission ---
      hostPermissionWeight: 30,
    },

    // Permission descriptions
    // Descriptions are now more direct about the specific risks.
    permissionDescriptions: {
      // --- Host Permissions ---
      "<all_urls>":
        "DANGEROUS: Allows the extension to read and change data on *all websites* you visit (e.g., bank, email, social media).",
      "*://*/*":
        "DANGEROUS: Allows the extension to read and change data on *all websites* you visit (e.g., bank, email, social media).",

      // --- API Permissions ---
      nativeMessaging:
        "CRITICAL RISK: Allows the extension to communicate with and run software *on your computer*, outside the browser's sandbox.",
      debugger:
        "CRITICAL RISK: Allows the extension to take full control of web pages. It can read all data (including passwords you type), record your actions, and modify content.",
      webAuthenticationProxy:
        "CRITICAL RISK: Allows the extension to intercept your hardware security key (e.g., YubiKey) or biometric logins.",
      proxy:
        "CRITICAL RISK: Allows the extension to redirect *all of your internet traffic* through its own servers, enabling it to monitor, block, or modify everything you do online.",
      vpnProvider:
        "CRITICAL RISK: Allows the extension to act as a VPN, routing *all of your internet traffic* through its own servers.",

      scripting:
        "VERY HIGH RISK: Allows the extension to inject and run its own code on websites you visit. This can be used to steal data, modify content, or log your keystrokes.",
      userScripts:
        "VERY HIGH RISK: Allows the extension to inject and run its own code on websites you visit. This can be used to steal data, modify content, or log your keystrokes.",
      webRequestBlocking:
        "VERY HIGH RISK: Allows the extension to block, modify, or redirect your network requests. Can be used for advanced tracking, ad-blocking, or malicious redirection.",
      webRequest:
        "HIGH RISK: Allows the extension to *observe* all network traffic and data being sent and received, including passwords, form data, and personal information.",
      clipboardRead:
        "HIGH RISK: Allows the extension to read anything you copy to your clipboard (passwords from password managers, crypto keys, personal messages).",
      cookies:
        "HIGH RISK: Allows the extension to read, change, and delete your cookies. This can be used to hijack your login sessions to websites.",
      identity_email:
        "HIGH RISK: Allows the extension to request your email address associated with your browser profile.",
      identity:
        "HIGH RISK: Allows the extension to request authentication (login) tokens, potentially giving it access to your web service accounts.",
      history:
        "HIGH RISK: Allows the extension to read and search your *entire* browsing history, which can be used for profiling and tracking.",

      desktopCapture:
        "HIGH RISK: Allows the extension to capture the contents of your entire screen.",
      tabCapture:
        "HIGH RISK: Allows the extension to record audio and video from your open tabs.",
      pageCapture:
        "HIGH RISK: Allows the extension to save a complete snapshot (MHTML) of a web page, including all text.",

      activeTab:
        "SAFE: Grants the extension temporary access to the *currently active tab* when you click the extension's icon. This is a secure, user-invoked permission.",
      alarms:
        "Allows the extension to schedule tasks to run at a specific time or on a repeating interval (e.g., check for new mail every 5 minutes).",
      audio:
        "Enables the extension to capture audio from open tabs or your microphone.",
      bookmarks:
        "Allows the extension to read, change, add, and delete your bookmarks.",
      browsingData:
        "Allows the extension to clear your browsing data, such as your history, cookies, cache, and downloads.",
      captivePortal:
        "Allows the extension to detect and interact with Wi-Fi login pages (captive portals).",
      clipboardWrite:
        "Allows the extension to add content to your clipboard, replacing whatever you last copied.",
      contentSettings:
        "Allows the extension to change browser settings for specific websites, such as enabling or blocking popups, JavaScript, or cookies.",
      contextMenus:
        "Allows the extension to add new items to your right-click (context) menu.",
      declarativeContent:
        "Allows the extension to show its icon in the address bar only when it's relevant to the current page's content.",
      declarativeNetRequest:
        "A safe, privacy-preserving way for extensions (like ad blockers) to block or modify network requests based on a set of rules.",
      declarativeNetRequestFeedback:
        "Allows the extension to get information about network requests that were blocked or modified by its rules.",
      declarativeNetRequestWithHostAccess:
        "Extends 'declarativeNetRequest' to let the extension use host permissions to modify requests.",
      dns: "Allows the extension to resolve domain names (e.g., 'google.com' to an IP address) using a custom DNS provider.",
      documentScan:
        "Allows the extension to interact with hardware document scanners.",
      downloads:
        "Allows the extension to start, monitor, pause, and cancel your downloads.",
      "downloads.open":
        "Allows the extension to open files it has downloaded, bypassing the browser's usual 'Open' prompt.",
      "downloads.ui":
        "Allows the extension to show or hide the browser's downloads shelf.",
      "enterprise.deviceAttributes":
        "Allows the extension to read device information in a managed (corporate) environment.",
      "enterprise.hardwarePlatform":
        "Allows the extension to read hardware platform information in a managed (corporate) environment.",
      "enterprise.networkingAttributes":
        "Allows the extension to read network information in a managed (corporate) environment.",
      "enterprise.platformKeys":
        "Allows the extension to manage security certificates in a managed (corporate) environment.",
      favicon:
        "Allows the extension to access the small icons (favicons) of your open tabs.",
      fileBrowserHandler:
        "Allows the extension to register itself as a file handler in the operating system's file browser.",
      fileSystemProvider:
        "Allows the extension to create and manage virtual file systems that can be accessed by the operating system.",
      fontSettings:
        "Allows the extension to change your browser's font settings.",
      gcm: "Allows the extension to receive push messages from Google Cloud Messaging (now deprecated, replaced by 'push').",
      geolocation:
        "Allows the extension to access your precise physical location without prompting you each time.",
      idle: "Allows the extension to detect when your computer is idle or in use.",
      loginState:
        "Allows the extension to monitor your login status in the browser.",
      management:
        "Allows the extension to view, enable, disable, or uninstall your *other* installed extensions.",
      notifications:
        "Allows the extension to create and display desktop notifications.",
      offscreen:
        "Allows the extension to create a hidden document to run tasks in the background.",
      platformKeys:
        "Allows the extension to access and manage hardware-backed security keys (like a YubiKey).",
      power:
        "Allows the extension to monitor the system's power state (e.g., prevent the system from sleeping).",
      printerProvider:
        "Allows the extension to provide its own virtual printers to the browser.",
      printing: "Allows the extension to initiate a print job.",
      printingMetrics:
        "Allows the extension to track information about print jobs.",
      privacy:
        "Allows the extension to read and change your browser's privacy settings (e.g., 'Safe Browsing' or 'Tracking Protection').",
      processes:
        "Allows the extension to query information about the browser's running processes.",
      readingList:
        "Allows the extension to read, add, and remove items from your Reading List.",
      runtime:
        "Provides basic extension functions, but 'runtime' itself is not a high-risk permission (though it enables 'nativeMessaging').",
      search:
        "Allows the extension to integrate with the browser's search provider settings.",
      searchProvider:
        "Allows the extension to read, change, or override your default search engine settings.",
      sessions:
        "Allows the extension to read and restore your open tabs and windows from your browsing session.",
      sidePanel:
        "Allows the extension to show content in the browser's side panel.",
      storage:
        "Allows the extension to store data locally or sync it across your devices. This is a standard permission.",
      "system.cpu":
        "Allows the extension to read information about your computer's CPU.",
      "system.display":
        "Allows the extension to read information about your computer's display(s).",
      "system.memory":
        "Allows the extension to read information about your computer's system memory (RAM).",
      "system.storage":
        "Allows the extension to get information about your computer's storage devices.",
      tabGroups:
        "Allows the extension to organize your tabs into groups (read, create, and modify groups).",
      tabs: "Allows the extension to see the URLs, titles, and icons of all your open tabs. Does *not* let it read the *content* of those tabs.",
      topSites:
        "Allows the extension to read the list of your most frequently visited websites (shown on the 'New Tab' page).",
      tts: "Allows the extension to use the browser's text-to-speech (TTS) engine.",
      ttsEngine:
        "Allows the extension to register itself *as* a text-to-speech engine, processing any text it is given to speak.",
      unlimitedStorage:
        "Allows the extension to bypass the standard 5MB limit for storing data locally.",
      wallpaper:
        "Allows the extension to change your browser or device wallpaper (ChromeOS-specific).",
      webNavigation:
        "Allows the extension to observe the status of web page navigation (e.g., when a page starts or finishes loading).",
      "accessibilityFeatures.read":
        "Allows the extension to read the state of your browser's accessibility features (e.g., if screen reader is on).",
      "accessibilityFeatures.modify":
        "Allows the extension to change the state of your browser's accessibility features.",
      certificateProvider:
        "Allows the extension to provide security certificates for authentication.",
      devtools:
        "Allows the extension to add new panels and features to the browser's developer tools.",
      mdns: "Allows the extension to discover services on your local network (LAN).",
      unknown:
        "This permission is not recognized. It may be from an older version of the browser or a typo.",
    },
  };

  // ==================================================
  // II. STATE (Mutable Data)
  // ==================================================
  const state = {
    installedExtensionIDs: new Set(),
    activeTooltip: null, // global reference to the *one* visible tooltip
  };

  // ==================================================
  // III. DOM (Cached Elements)
  // ==================================================
  const dom = {
    mainView: null,
    storeView: null,
    storeBtn: null,
    backBtn: null,
    refreshBtn: null,
    extName: null,
    extList: null,
    subline: null,
    storeList: null,
  };

  /**
   * Caches all required DOM elements into the `dom` object.
   */
  const cacheDom = () => {
    dom.mainView = document.getElementById("main-view");
    dom.storeView = document.getElementById("store-view");
    dom.storeBtn = document.getElementById("storeBtn");
    dom.backBtn = document.getElementById("backBtn");
    dom.refreshBtn = document.getElementById("refreshBtn");
    dom.extName = document.getElementById("extName");
    dom.extList = document.getElementById("extList");
    dom.subline = document.getElementById("subline");
    dom.storeList = document.getElementById("store-list");
  };

  // ==================================================
  // IV. UTILS (Reusable Helpers)
  // ==================================================
  const utils = {
    /**
     * Sanitizes a string for safe HTML injection.
     * @param {string} s - The string to escape.
     * @returns {string} The escaped string.
     */
    escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    },

    /**
     * Attaches a simple, static tooltip to a target element.
     * Used for badges and extension card descriptions.
     * @param {HTMLElement} target - The element to attach the listener to.
     * @param {string} text - The text to display in the tooltip.
     */
    attachStaticTooltip(target, text) {
      target.addEventListener("mouseenter", () => {
        utils.removeActiveTooltip(); // Remove any existing tooltip

        const tooltip = document.createElement("div");
        tooltip.className = "permission-tooltip";
        tooltip.innerHTML = text; // Use innerHTML to allow line breaks
        tooltip.style.position = "absolute";
        tooltip.style.pointerEvents = "none";
        tooltip.style.opacity = "0";
        document.body.appendChild(tooltip);
        state.activeTooltip = tooltip;

        const rect = target.getBoundingClientRect();
        requestAnimationFrame(() => {
          const top = Math.max(8, rect.top - tooltip.offsetHeight - 6);
          const left = Math.min(
            Math.max(8, rect.left + rect.width / 2 - tooltip.offsetWidth / 2),
            window.innerWidth - tooltip.offsetWidth - 8,
          );
          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
          tooltip.style.opacity = "1";
        });
      });

      target.addEventListener("mouseleave", () => {
        utils.removeActiveTooltip();
      });
    },

    /**
     * Removes the currently active tooltip from the DOM.
     */
    removeActiveTooltip() {
      if (state.activeTooltip) {
        state.activeTooltip.remove();
        state.activeTooltip = null;
      }
    },
  };

  // ==================================================
  // V. RISK LOGIC (Business Logic)
  // ==================================================
  const riskLogic = {
    /**
     * Calculates a numerical risk score for an extension.
     * @param {string[]} perms - List of permissions.
     * @param {boolean} isVerified - Whether the extension ID is in the verified list.
     * @returns {{score: number, breakdown: object}} A risk score (0-100) and a breakdown.
     */
    calculateRisk(perms = [], isVerified = false) {
      try {
        if (!Array.isArray(perms) || perms.length === 0) {
          return { score: 0, breakdown: { base: 0 } };
        }

        const breakdown = {
          base: 0,
          synergy: 0,
          host: 0,
          trust: 0,
          highestRisk: { perm: "N/A", value: 0 },
        };

        const weights = perms.map((p) => {
          let weight = config.permissionRiskWeights[p];
          if (weight === undefined) {
            // Handle specific host permissions
            if (p.includes("://")) {
              weight = config.permissionRiskWeights.hostPermissionWeight;
            } else {
              weight = config.permissionRiskWeights.unknown; // Default for unknown
            }
          }
          if (weight > breakdown.highestRisk.value) {
            breakdown.highestRisk = { perm: p, value: weight };
          }
          return weight;
        });

        const count = weights.length || 1;
        const avg = weights.reduce((a, b) => a + b, 0) / count;
        const max = breakdown.highestRisk.value;

        // NEW ALGORITHM: 70% of max + 30% of avg
        // This heavily weights the *single most dangerous* permission.
        let base = 0.7 * max + 0.3 * avg;
        breakdown.base = Math.round(base);

        // --- Synergy Bonuses ---
        const has = (p) => perms.includes(p);
        const hasAllUrls = has("<all_urls>") || has("*://*/*");
        const hasScript = has("scripting") || has("userScripts");
        const hasWebReq = has("webRequest") || has("webRequestBlocking");
        const hasCookies = has("cookies");
        const hasClipboardRead = has("clipboardRead");
        const hasNative = has("nativeMessaging");

        if (hasScript && hasAllUrls) breakdown.synergy += 15; // Code injection on all sites
        if (hasWebReq && hasAllUrls) breakdown.synergy += 10; // Network inspection on all sites
        if (hasCookies && hasAllUrls) breakdown.synergy += 10; // Session hijacking on all sites
        if (hasClipboardRead && hasScript) breakdown.synergy += 10; // Paste-jacking/keylogging
        if (hasNative && (hasScript || hasWebReq)) breakdown.synergy += 20; // Exfiltrating data to local app

        // --- Host Permission Bonus ---
        // Count specific hosts (e.g., *://*.google.com/*)
        const hostCount = perms.filter(
          (p) => p.includes("://") && !hasAllUrls,
        ).length;

        if (hostCount > 15) {
          breakdown.host = 20; // "Wide net" permission grab
        } else if (hostCount > 5) {
          breakdown.host = 10; // Suspiciously broad
        }

        // --- Trust Factor ---
        if (isVerified) {
          breakdown.trust = -10; // Verified publisher discount
        }

        // Calculate final score
        let total = base + breakdown.synergy + breakdown.host + breakdown.trust;

        // Ensure score is 0-100
        const score = Math.max(0, Math.min(Math.round(total), 100));

        if (isNaN(score)) return { score: 0, breakdown: { base: 0 } };
        return { score, breakdown };
      } catch (e) {
        console.error("calculateRisk error:", e);
        return { score: 0, breakdown: { base: 0 } };
      }
    },

    /**
     * Gets a human-readable risk category based on score.
     * @param {number} score - The calculated risk score.
     * @returns {{label: string, color: string, tooltip: string}}
     */
    getRiskCategory(score) {
      if (score <= 15) {
        return {
          label: "Safe",
          color: "safe",
          tooltip: "No permissions or only safe, user-invoked permissions.",
        };
      }
      if (score <= 39) {
        return {
          label: "Limited Access",
          color: "low-risk",
          tooltip:
            "Requests limited browser features (e.g., storage, alarms). Cannot access web content.",
        };
      }
      if (score <= 69) {
        return {
          label: "Broad Access",
          color: "medium-risk",
          tooltip:
            "Can access some browsing data (e.g., tabs, bookmarks) or modify specific site settings. Review permissions.",
        };
      }
      if (score <= 84) {
        return {
          label: "High Access",
          color: "high-risk",
          tooltip:
            "Can read/change data on some or all websites, or access sensitive info (e.g., history, cookies, clipboard).",
        };
      }
      return {
        label: "Critical Access",
        color: "very-high",
        tooltip:
          "Has system-level access (e.g., proxy, native messaging) or can read/change data on all sites. Trust is essential.",
      };
    },

    /**
     * Generates an intelligent, human-readable summary and score breakdown.
     * @param {string[]} perms - The list of permission strings.
     * @param {number} score - The pre-calculated risk score.
     * @param {object} breakdown - The breakdown object from calculateRisk.
     * @param {object} meta - Additional metadata.
     * @returns {{summary: string, details: string}} An object with summary and score details.
     */
    generateSmartTooltip(perms = [], score, breakdown, meta = {}) {
      if (!Array.isArray(perms)) perms = [];
      const includes = (p) => perms.includes(p);
      const includesHostAll = () =>
        perms.includes("<all_urls>") || perms.includes("*://*/*");

      // --- 1. Generate Summary ---
      let summary = "";
      if (perms.length === 0) {
        summary = "No permissions requested.";
      } else if (score <= 15 && includes("activeTab")) {
        summary = "Accesses active tab when clicked. Low risk.";
      } else {
        const ind = {
          native: includes("nativeMessaging"),
          proxy: includes("proxy") || includes("vpnProvider"),
          debugger: includes("debugger"),
          allSitesScript:
            includesHostAll() &&
            (includes("scripting") || includes("userScripts")),
          allSitesWebReq:
            includesHostAll() &&
            (includes("webRequest") || includes("webRequestBlocking")),
          allSitesRead: includesHostAll(),
          clipboard: includes("clipboardRead"),
          history: includes("history"),
          cookies: includes("cookies"),
        };

        const capabilities = [];
        if (ind.native) capabilities.push("run software on your computer");
        if (ind.proxy) capabilities.push("intercept all network traffic");
        if (ind.debugger) capabilities.push("take full control of pages");
        if (ind.allSitesScript)
          capabilities.push("read and change all websites");
        else if (ind.allSitesWebReq)
          capabilities.push("inspect traffic on all websites");
        else if (ind.allSitesRead)
          capabilities.push("read data on all websites");

        if (ind.clipboard) capabilities.push("read your clipboard");
        if (ind.history) capabilities.push("read your browsing history");
        if (ind.cookies) capabilities.push("access your website cookies");

        if (capabilities.length === 0) {
          if (score <= 39) summary = "Accesses limited browser features.";
          else if (score <= 69) summary = "Can access some browsing data.";
          else summary = "Accesses sensitive data. Review permissions.";
        } else if (capabilities.length === 1) {
          summary = `Can ${capabilities[0]}.`;
        } else {
          summary = `Can ${capabilities[0]} and ${capabilities[1]}.`;
        }
      }

      // --- 2. Generate Score Breakdown ---
      const b = breakdown;
      let details = `<b>Score Breakdown (Score: ${score}/100)</b><br>`;
      if (b.base > 0) {
        details += `• Base Risk: +${b.base} (from '${b.highestRisk.perm}')<br>`;
      }
      if (b.synergy > 0) {
        details += `• Permission Synergy: +${b.synergy}<br>`;
      }
      if (b.host > 0) {
        details += `• Wide Host Access: +${b.host}<br>`;
      }
      if (b.trust < 0) {
        details += `• Verified Publisher: ${b.trust}<br>`;
      }
      if (score === 0) {
        details = "No scorable permissions found.";
      }

      return { summary, details };
    },
  };

  // ==================================================
  // VI. API (Data Fetching Layer)
  // ==================================================
  const api = {
    /**
     * Fetches and enriches all installed extensions.
     * @returns {Promise<{enabled: object[], disabled: object[]}>}
     */
    async getInstalledExtensions() {
      if (!chrome.management || !chrome.management.getAll) {
        console.error("chrome.management API not available.");
        throw new Error("Error: 'management' permission missing.");
      }

      let managementExts;
      try {
        managementExts = await new Promise((resolve, reject) => {
          chrome.management.getAll((exts) => {
            if (chrome.runtime.lastError)
              return reject(chrome.runtime.lastError);
            resolve(exts);
          });
        });
      } catch (err) {
        console.error(err);
        throw new Error("Error loading extensions.");
      }

      const validExtensions = managementExts.filter((e) => {
        if (!e) return false;
        if (e.id === chrome.runtime.id) return false;
        return (
          ["extension", "hosted_app", "packaged_app", "theme"].includes(
            e.type,
          ) || !!e.installType
        );
      });

      // Re-populate the global Set of installed IDs
      state.installedExtensionIDs.clear();
      validExtensions.forEach((ext) => state.installedExtensionIDs.add(ext.id));

      const enriched = await Promise.all(
        validExtensions.map(async (ext) => {
          let allPermissions = [
            ...(ext.permissions || []),
            ...(ext.hostPermissions || []),
          ];
          return {
            ...ext,
            allPermissions: Array.from(new Set(allPermissions)),
          };
        }),
      );

      return {
        enabled: enriched.filter((e) => e.enabled),
        disabled: enriched.filter((e) => !e.enabled),
      };
    },

    /**
     * Fetches metadata for a single extension from chrome-stats.com.
     * @param {string} id - The extension ID.
     * @returns {Promise<object>}
     */
    async fetchStoreData(id) {
      const cacheBust = `&_t=${Date.now()}`;
      const url = `https://chrome-stats.com/api/query?q=${id}${cacheBust}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const item = data?.items?.[0];

      if (item && item.logo && item.name) {
        return {
          id: item.id,
          name: item.name,
          logo: item.logo,
        };
      } else {
        throw new Error("Invalid API response format.");
      }
    },

    /**
     * Fetches recommendations and filters out already-installed ones.
     * @returns {Promise<object[]>} A list of recommended extensions to show.
     */
    async getStoreRecommendations() {
      const recommendations = [];
      let apiSuccessCount = 0;

      const fetchPromises = config.verifiedExtensionIDs.map(async (id) => {
        try {
          // Skip fetching if it's already installed
          if (state.installedExtensionIDs.has(id)) {
            return;
          }
          const extData = await api.fetchStoreData(id);
          apiSuccessCount++;
          recommendations.push(extData);
        } catch (err) {
          console.warn(
            `❌ Failed to fetch store data for ${id}: ${err.message}`,
          );
        }
      });

      await Promise.allSettled(fetchPromises);

      if (apiSuccessCount === 0 && recommendations.length === 0) {
        // Only throw error if *nothing* could be shown
        throw new Error("Could not load recommendations.");
      }
      return recommendations;
    },

    /**
     * Toggles an extension's enabled state.
     * @param {string} extId - The extension ID.
     * @param {boolean} isChecked - The new enabled state.
     */
    setEnabled(extId, isChecked) {
      chrome.management.setEnabled(extId, isChecked, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
        // Refresh the list after a short delay
        setTimeout(app.refreshExtensions, 200);
      });
    },

    /**
     * Uninstalls an extension.
     * @param {string} extId - The extension ID.
     */
    uninstallExtension(extId) {
      chrome.management.uninstall(extId, { showConfirmDialog: true }, () => {
        if (chrome.runtime.lastError) {
          // User likely cancelled the dialog, no need to refresh
          console.log("Uninstall cancelled or failed.");
        } else {
          app.refreshExtensions();
        }
        ui.closeContextMenu();
      });
    },

    /**
     * Opens the web store page for a given extension ID.
     * @param {string} extId - The extension ID.
     */
    viewInStore(extId) {
      chrome.tabs.create({
        url: `https://chrome.google.com/webstore/detail/${extId}`,
      });
    },
  };

  // ==================================================
  // VII. UI (View / DOM Manipulation)
  // ==================================================
  const ui = {
    /**
     * Renders the complete list of enabled/disabled extensions.
     * @param {object[]} enabled - List of enabled extensions.
     * @param {object[]} disabled - List of disabled extensions.
     */
    renderExtensionList(enabled, disabled) {
      dom.extList.innerHTML = "";
      dom.subline.textContent = `${enabled.length} enabled • ${disabled.length} disabled`;

      // Sort by name
      const sortByName = (a, b) => a.name.localeCompare(b.name);
      enabled.sort(sortByName);
      disabled.sort(sortByName);

      ui.addSection("ENABLED", enabled);
      ui.addSection("DISABLED", disabled);
    },

    /**
     * Adds a section (e.g., "ENABLED") to the list.
     * @param {string} title - The section title.
     * @param {object[]} items - List of extensions in that section.
     */
    addSection(title, items) {
      if (items.length === 0) return; // Don't show empty sections

      const header = document.createElement("div");
      header.className = "section-header";
      header.textContent = `${title} (${items.length})`;
      dom.extList.appendChild(header);

      items.forEach((ext) => {
        const card = ui.createExtensionCard(ext);
        dom.extList.appendChild(card);
      });
    },

    /**
     * Creates a single extension card element.
     * @param {object} ext - The extension data object.
     * @returns {HTMLElement} The generated card element.
     */
    createExtensionCard(ext) {
      let displayName = ext.name;
      if (!displayName || displayName.includes("__MSG__")) {
        displayName = ext.short_name;
      }
      if (!displayName || displayName.includes("__MSG__")) {
        displayName = ext.id ? ext.id.substring(0, 12) + "..." : "Unknown";
      }

      const card = document.createElement("div");
      card.className = "ext-container";

      // Context menu
      if (ext.installType !== "admin") {
        card.addEventListener("contextmenu", (e) => {
          ui.showContextMenu(e, ext.id);
        });
      }

      const row = document.createElement("div");
      row.className = "ext-row";

      const info = document.createElement("div");
      info.className = "ext-info";

      // Icon (real or placeholder)
      let icon;
      if (ext.icons && ext.icons[0] && ext.icons[0].url) {
        icon = document.createElement("img");
        icon.className = "ext-icon";
        icon.src = ext.icons[0].url;
      } else {
        icon = document.createElement("div");
        icon.className = "placeholder-icon";
        const letter = displayName?.trim()?.[0]?.toUpperCase() || "?";
        icon.textContent = letter;
        const colors = [
          "#7fff91",
          "#ffb347",
          "#5cb6ff",
          "#ff5c5c",
          "#a78bfa",
          "#00d1b2",
        ];
        let colorIndex = 0;
        if (ext.id) {
          for (let i = 0; i < ext.id.length; i++)
            colorIndex += ext.id.charCodeAt(i);
        }
        icon.style.backgroundColor = colors[colorIndex % colors.length];
      }

      const details = document.createElement("div");
      details.className = "ext-details";

      const allPerms = ext.allPermissions || [];
      const verified = config.verifiedExtensionIDs.includes(ext.id);

      // --- NEW: Risk score & tooltip ---
      const { score, breakdown } = riskLogic.calculateRisk(allPerms, verified);
      const { label, color } = riskLogic.getRiskCategory(score);
      const { summary, details: breakdownDetails } =
        riskLogic.generateSmartTooltip(allPerms, score, breakdown, {
          installType: ext.installType,
          verified,
          name: ext.name,
        });

      // This is the tooltip for the *Risk Badge*
      const badgeTooltipText = `${summary}<br><br>${breakdownDetails}`;

      // --- Source badge ---
      let sourceBadge = "";
      let sourceTip = "";
      switch (ext.installType) {
        case "admin":
          sourceBadge = "⚙️ Policy";
          sourceTip = "Installed by system or enterprise policy.";
          break;
        case "sideload":
          sourceBadge = "⚠️ Sideloaded";
          sourceTip =
            "Installed by another program on your computer (high risk).";
          break;
        case "development":
          sourceBadge = "🧩 Dev";
          sourceTip = "Unpacked developer extension (Developer mode).";
          break;
      }

      // Build card HTML
      details.innerHTML = `
        <div class="ext-name-line">
          <span class="ext-name" title="${utils.escapeHtml(displayName)}">
            ${utils.escapeHtml(displayName)}
          </span>
          <div class="badges">
            ${
              sourceBadge
                ? `<span class="source-badge" data-tooltip="${utils.escapeHtml(
                    sourceTip,
                  )}">${sourceBadge}</span>`
                : ""
            }
            <span
              class="verify-badge ${verified ? "verified" : "unverified"}"
              data-tooltip="${
                verified
                  ? "Verified: This is a known, trusted extension."
                  : "Unverified: This extension is not in our trusted database."
              }"
            >
              ${verified ? "✔️" : "❓"}
            </span>
          </div>
        </div>
        <div class="ext-meta">
          <span class="ext-version">v${utils.escapeHtml(ext.version || "?")}</span>
          <span class="risk-badge ${color}" data-tooltip="${utils.escapeHtml(
            badgeTooltipText,
          )}">
            ${utils.escapeHtml(label)}
          </span>
        </div>
      `;

      info.appendChild(icon);
      info.appendChild(details);

      // Toggle switch
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.className = "toggle";
      toggle.checked = !!ext.enabled;
      toggle.disabled = ext.installType === "admin";
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        api.setEnabled(ext.id, e.target.checked);
      });

      row.appendChild(info);
      row.appendChild(toggle);
      card.appendChild(row);

      // Permissions panel
      const permSection = document.createElement("div");
      permSection.className = "permissions";
      if (allPerms.length) {
        // Sort permissions by risk
        allPerms.sort((a, b) => {
          const weightA =
            config.permissionRiskWeights[a] ||
            (a.includes("://")
              ? config.permissionRiskWeights.hostPermissionWeight
              : config.permissionRiskWeights.unknown);
          const weightB =
            config.permissionRiskWeights[b] ||
            (b.includes("://")
              ? config.permissionRiskWeights.hostPermissionWeight
              : config.permissionRiskWeights.unknown);
          return weightB - weightA;
        });

        allPerms.forEach((p) => {
          permSection.appendChild(ui.createPermissionItem(p));
        });
      } else {
        const none = document.createElement("div");
        none.className = "permission-item";
        none.textContent = "No permissions requested.";
        permSection.appendChild(none);
      }
      card.appendChild(permSection);

      // --- Attach static tooltips ---
      card
        .querySelectorAll(".verify-badge, .source-badge, .risk-badge")
        .forEach((badge) =>
          utils.attachStaticTooltip(badge, badge.dataset.tooltip),
        );

      // This is the tooltip for the *main card* (description)
      utils.attachStaticTooltip(
        card,
        ext.description || "No description available.",
      );

      // Toggle permission panel on row click
      row.addEventListener("click", (e) => {
        if (e.target !== toggle) {
          const isVisible = permSection.style.display === "flex";
          // Hide all *other* permission panels
          document.querySelectorAll(".permissions").forEach((p) => {
            if (p !== permSection) p.style.display = "none";
          });
          // Toggle the current one
          permSection.style.display = isVisible ? "none" : "flex";
        }
      });

      return card;
    },

    /**
     * Creates a single permission item element with a dynamic tooltip.
     * @param {string} p - The permission string.
     * @returns {HTMLElement} The generated permission item.
     */
    createPermissionItem(p) {
      let desc = config.permissionDescriptions[p];
      let riskWeight = config.permissionRiskWeights[p];

      if (!desc) {
        if (p.includes("://")) {
          desc = `Allows the extension to read/change data on: ${p}`;
          riskWeight = config.permissionRiskWeights.hostPermissionWeight;
        } else {
          desc = "No detailed info available for this permission.";
          riskWeight = config.permissionRiskWeights.unknown;
        }
      }

      const permItem = document.createElement("div");
      permItem.className = "permission-item";
      permItem.textContent = p;

      // Add risk styling
      if (riskWeight >= 80) {
        permItem.classList.add("risk-critical");
      } else if (riskWeight >= 60) {
        permItem.classList.add("risk-high");
      } else if (riskWeight >= 30) {
        permItem.classList.add("risk-medium");
      }

      // Attach dynamic, mouse-following tooltip
      ui.attachPermissionTooltip(permItem, desc);

      return permItem;
    },

    /**
     * Attaches the mouse-following tooltip for permission items.
     * @param {HTMLElement} target - The permission item element.
     * @param {string} text - The description text.
     */
    attachPermissionTooltip(target, text) {
      target.addEventListener("mouseenter", (e) => {
        utils.removeActiveTooltip(); // Remove any existing tooltip

        const tip = document.createElement("div");
        tip.className = "permission-tooltip";
        tip.innerHTML = text; // Use innerHTML for formatting
        tip.style.position = "fixed";
        tip.style.pointerEvents = "none";
        tip.style.opacity = "0";
        document.body.appendChild(tip);
        state.activeTooltip = tip;

        // Initial position
        const offsetX = 14;
        const offsetY = 12;
        requestAnimationFrame(() => {
          const left = Math.min(
            Math.max(8, e.clientX + offsetX),
            window.innerWidth - tip.offsetWidth - 8,
          );
          const top = Math.min(
            Math.max(8, e.clientY + offsetY),
            window.innerHeight - tip.offsetHeight - 8,
          );
          tip.style.left = `${left}px`;
          tip.style.top = `${top}px`;
          tip.style.opacity = "1";
        });
      });

      target.addEventListener("mousemove", (e) => {
        if (state.activeTooltip) {
          // Only reposition existing tooltip
          const offsetX = 14;
          const offsetY = 12;
          requestAnimationFrame(() => {
            const left = Math.min(
              Math.max(8, e.clientX + offsetX),
              window.innerWidth - state.activeTooltip.offsetWidth - 8,
            );
            const top = Math.min(
              Math.max(8, e.clientY + offsetY),
              window.innerHeight - state.activeTooltip.offsetHeight - 8,
            );
            state.activeTooltip.style.left = `${left}px`;
            state.activeTooltip.style.top = `${top}px`;
          });
        }
      });

      target.addEventListener("mouseleave", () => {
        utils.removeActiveTooltip();
      });
    },

    /**
     * Renders the list of recommended extensions.
     * @param {object[]} recommendations - List of extensions to show.
     */
    renderStoreList(recommendations) {
      dom.storeList.innerHTML = ""; // Clear loading/error state

      if (recommendations.length === 0) {
        dom.storeList.innerHTML = `<div class="store-item-error">All recommendations already installed.</div>`;
        return;
      }

      recommendations.forEach((ext) => {
        const item = document.createElement("div");
        item.className = "store-item";
        item.innerHTML = `
          <img class="ext-icon" src="${utils.escapeHtml(ext.logo)}" alt="">
          <div class="store-details">
              <span class="store-name">${utils.escapeHtml(ext.name)}</span>
          </div>
          <button class="store-view-btn" data-id="${ext.id}">View</button>
        `;

        item.querySelector(".store-view-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          api.viewInStore(e.currentTarget.dataset.id);
        });

        dom.storeList.appendChild(item);
      });
    },

    /**
     * Switches between the 'main' and 'store' views.
     * @param {'main' | 'store'} viewName - The view to switch to.
     */
    switchView(viewName) {
      const DURATION = 250;
      const isMain = viewName === "main";

      const from = isMain ? dom.storeView : dom.mainView;
      const to = isMain ? dom.mainView : dom.storeView;
      const title = isMain ? "Management" : "Recommended";

      from.style.opacity = "0";
      from.style.visibility = "hidden";

      setTimeout(() => {
        from.classList.remove("active");
        to.classList.add("active");
        requestAnimationFrame(() => {
          to.style.opacity = "1";
          to.style.visibility = "visible";
        });

        dom.extName.textContent = title;
        dom.backBtn.classList.toggle("invisible", isMain);
        dom.storeBtn.classList.toggle("invisible", !isMain);
      }, DURATION);
    },

    /**
     * Displays the custom context (right-click) menu.
     * @param {MouseEvent} event - The contextmenu event.
     * @param {string} extId - The ID of the extension to uninstall.
     */
    showContextMenu(event, extId) {
      event.preventDefault();
      event.stopPropagation();
      ui.closeContextMenu();

      const menu = document.createElement("div");
      menu.id = "context-menu";

      // Position menu, ensuring it stays within the viewport
      const menuWidth = 150;
      const menuHeight = 40;
      const left = Math.min(event.pageX, window.innerWidth - menuWidth - 10);
      const top = Math.min(event.pageY, window.innerHeight - menuHeight - 10);

      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "context-menu-btn";
      deleteBtn.innerHTML = "🗑️ Uninstall";
      deleteBtn.addEventListener("click", () => {
        api.uninstallExtension(extId);
      });

      menu.appendChild(deleteBtn);
      document.body.appendChild(menu);
      document.addEventListener("click", ui.closeContextMenu, { once: true });
    },

    /**
     * Closes the custom context menu.
     */
    closeContextMenu() {
      const existing = document.getElementById("context-menu");
      if (existing) existing.remove();
    },

    /**
     * Sets the store view to a loading state.
     */
    setStoreLoading() {
      dom.storeList.innerHTML = `<div class="store-item-loading">Loading recommendations...</div>`;
    },

    /**
     * Sets the store view to an error state.
     * @param {string} message - The error message to display.
     */
    setStoreError(message) {
      dom.storeList.innerHTML = `<div class="store-item-error">${utils.escapeHtml(
        message,
      )}</div>`;
    },
  };

  // ==================================================
  // VIII. APP (Controller & Initializer)
  // ==================================================
  const app = {
    /**
     * Main entry point. Caches DOM, binds listeners, and loads initial data.
     */
    async init() {
      cacheDom();
      app.bindListeners();
      await app.refreshExtensions();
    },

    /**
     * Binds all persistent event listeners.
     */
    bindListeners() {
      dom.refreshBtn.addEventListener("click", app.refreshExtensions);
      dom.storeBtn.addEventListener("click", app.showStore);
      dom.backBtn.addEventListener("click", app.showMain);
      // Close any tooltips when the window loses focus
      window.addEventListener("blur", utils.removeActiveTooltip);
    },

    /**
     * Controller function to load and render the main extension list.
     */
    async refreshExtensions() {
      dom.subline.textContent = "Loading...";
      dom.extList.innerHTML = "";
      dom.refreshBtn.disabled = true;
      try {
        const { enabled, disabled } = await api.getInstalledExtensions();
        ui.renderExtensionList(enabled, disabled);
      } catch (err) {
        dom.subline.textContent = err.message;
      } finally {
        dom.refreshBtn.disabled = false;
      }
    },

    /**
     * Controller function to show the 'store' view.
     */
    async showStore() {
      if (dom.storeView.classList.contains("active")) return;

      ui.switchView("store");
      ui.setStoreLoading();

      try {
        // We need the list of installed extensions to filter the store list
        await api.getInstalledExtensions();
        const recommendations = await api.getStoreRecommendations();
        ui.renderStoreList(recommendations);
      } catch (err) {
        ui.setStoreError(err.message);
      }
    },

    /**
     * Controller function to show the 'main' view.
     */
    showMain() {
      if (dom.mainView.classList.contains("active")) return;
      ui.switchView("main");
      // Pro-actively refresh the list when returning to main view
      app.refreshExtensions();
    },
  };

  // Public API: Expose only the init function
  return {
    init: app.init,
  };
})();

// ==================================================
// IX. STARTUP
// ==================================================
document.addEventListener("DOMContentLoaded", xtnMonitor.init);
