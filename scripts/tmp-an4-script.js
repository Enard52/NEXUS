<script>
      (() => {
        "use strict";
        const $ = (selector, scope = document) => scope.querySelector(selector);
        const $$ = (selector, scope = document) => [
          ...scope.querySelectorAll(selector),
        ];
        const imageSources = {
          hue: "IMG",
          nest: "IMG",
          sonos:
            "IMG",
          nuki: "IMG",
          roborock:
            "IMG",
        };
        const devices = {
          hue: {
            brand: "Philips Hue",
            name: "White A19 75W",
            description: "Soft white smart LED · E26 · Bluetooth + Hue Bridge",
            room: "Living room",
            category: "Lighting",
            status: "Online · responding locally",
            title: "Living room lights",
            subtitle: "4 bulbs grouped",
            level: 78,
            label: "Brightness",
            suffix: "%",
            min: 0,
            max: 100,
            protocol: "Zigbee",
            model: "9290023349",
            capability: "Lighting",
            connection: "Hue Bridge · Strong",
            firmware: "1.122.2",
            hardware: "9.5 W · 1100 lm",
            metricLabel: "Power draw",
            metricValue: "8.7 W",
            lastActivity: "Changed 3 min ago",
            presets: true,
            alt: "Philips Hue White A19 smart bulb",
          },
          nest: {
            brand: "Google Nest",
            name: "Learning Thermostat 3rd Gen",
            description: "Learning climate controller · Wi-Fi · Eco cooling",
            room: "Living room",
            category: "Climate",
            status: "Online · Eco cooling",
            title: "Nest Learning Thermostat",
            subtitle: "Cooling · Eco",
            level: 80,
            label: "Target temperature",
            suffix: "°F",
            min: 60,
            max: 90,
            protocol: "Wi-Fi",
            model: "3rd generation",
            capability: "Climate",
            connection: "Wi-Fi · Strong",
            firmware: "6.2-27",
            hardware: "24 V HVAC · 46% humidity",
            metricLabel: "Indoor humidity",
            metricValue: "46%",
            lastActivity: "Adjusted 8 min ago",
            alt: "Nest Learning Thermostat third generation",
          },
          sonos: {
            brand: "Sonos",
            name: "One · Gen 2",
            description:
              "Wireless smart speaker · AirPlay 2 · two Class-D amplifiers",
            room: "Living room",
            category: "Audio",
            status: "Online · playback paused",
            title: "Living room audio",
            subtitle: "Sonos One · Paused",
            level: 32,
            label: "Volume",
            suffix: "%",
            min: 0,
            max: 100,
            protocol: "Wi-Fi",
            model: "One Gen 2",
            capability: "Audio",
            connection: "Wi-Fi · Excellent",
            firmware: "S2 · 16.2",
            hardware: "2 × Class-D · AirPlay 2",
            metricLabel: "Audio format",
            metricValue: "AirPlay 2",
            lastActivity: "Paused 12 min ago",
            alt: "Black Sonos One speaker",
          },
          nuki: {
            brand: "Nuki",
            name: "Smart Lock 2.0",
            description:
              "Retrofit access control · Bluetooth · Bridge connectivity",
            room: "Entry",
            category: "Access control",
            status: "Online · locked securely",
            title: "Front door",
            subtitle: "Locked · Door closed",
            level: 64,
            label: "Battery",
            suffix: "%",
            min: 0,
            max: 100,
            protocol: "Bluetooth",
            model: "Smart Lock 2.0",
            capability: "Access control",
            connection: "Nuki Bridge · Strong",
            firmware: "2.15.4",
            hardware: "4 × AA · 64% remaining",
            metricLabel: "Door sensor",
            metricValue: "Closed",
            lastActivity: "Locked 18 min ago",
            alt: "Nuki Smart Lock",
          },
          roborock: {
            brand: "Roborock",
            name: "S4",
            description:
              "Laser navigation robot vacuum · Wi-Fi · charging dock",
            room: "Utility",
            category: "Cleaning",
            status: "Docked · charging",
            title: "Floor cleaning",
            subtitle: "Docked · Next run 10:00",
            level: 82,
            label: "Battery",
            suffix: "%",
            min: 0,
            max: 100,
            protocol: "Wi-Fi",
            model: "S4",
            capability: "Cleaning",
            connection: "Wi-Fi 2.4 GHz · Good",
            firmware: "01.04.86",
            hardware: "Charging · Last clean 46 m²",
            metricLabel: "Dock state",
            metricValue: "Charging",
            lastActivity: "Docked 26 min ago",
            alt: "Roborock S4 robot vacuum at its charging dock",
          },
        };
        const pages = {
          home: ["Good evening, Ensar", "Your home"],
          suggestions: ["NEXUS AI · Experience memory", "Suggestions"],
          devices: ["Universal Capability Fabric", "Devices"],
          skills: ["Reusable intelligence", "Skills"],
          agents: ["NEXUS Core orchestration", "Agents"],
          platforms: ["Encrypted cross-platform sync", "Platforms"],
          family: ["Multi-user permissions", "Family & access"],
          personalization: ["User Memory", "Personalization"],
          security: ["Security Engine", "Security & activity"],
          billing: ["Household subscription", "Plan & billing"],
          updates: ["Windows distribution", "Updates"],
          support: ["Onboarding & diagnostics", "Help & support"],
        };
        const settings = {
          assistantName: "NEXUS AI",
          wakeWord: "Hey Nexus",
          tone: "Balanced",
        };
        const aiModes = ["smart", "controlled", "agent"];
        let activeDevice = "nest";
        let assistantState = "idle";
        let assistantStateTimer = 0;
        let listeningTimer = 0;

        const assistantStateMessages = {
          idle: "Ask naturally · runs locally",
          listening: "Listening locally…",
          thinking: "Understanding · checking permissions…",
          success: "Ready · 42 ms",
          error: "Couldn’t complete that locally",
        };
        const deviceUiStates = {
          loading: {
            icon: "i-update",
            kicker: "Local discovery",
            title: "Refreshing your home",
            copy: "NEXUS is checking trusted devices and capabilities on your local network.",
            action: "Try again",
            intent: "retry",
          },
          empty: {
            icon: "i-devices",
            kicker: "No devices found",
            title: "Your local home is ready to connect",
            copy: "Scan this network or add a device securely. Credentials and home topology remain on this PC.",
            action: "Scan network",
            intent: "scan",
          },
          offline: {
            icon: "i-bolt",
            kicker: "Connection interrupted",
            title: "Selected device is offline",
            copy: "NEXUS kept the last trusted state and will reconnect without sending device data to the cloud.",
            action: "Retry connection",
            intent: "retry",
          },
          denied: {
            icon: "i-shield",
            kicker: "Permission required",
            title: "Allow local network access",
            copy: "Windows local-network permission is required to discover and control devices in your home.",
            action: "Open permissions",
            intent: "permissions",
          },
          error: {
            icon: "i-help",
            kicker: "Local service unavailable",
            title: "NEXUS couldn’t refresh this view",
            copy: "Your existing device data is safe. Retry the local service without resetting your home.",
            action: "Try again",
            intent: "retry",
          },
        };

        const escapeHtml = (value) =>
          String(value).replace(
            /[&<>"']/g,
            (character) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
              })[character],
          );
        function emitNative(name, detail = {}) {
          window.dispatchEvent(new CustomEvent(`nexus:${name}`, { detail }));
          const api = window.nexusDesktop?.api;
          if (api && typeof api.send === "function") api.send(name, detail);
        }
        function toast(
          title,
          message = "The native flow is ready to continue.",
        ) {
          const node = document.createElement("div");
          node.className = "toast";
          node.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
          $("#toast-region").append(node);
          window.setTimeout(() => node.remove(), 3000);
        }
        function setAssistantState(state, detail = {}) {
          const safeState = assistantStateMessages[state] ? state : "idle";
          const compose = $("#nexus-compose");
          const mic = $("[data-mic]");
          if (safeState !== "success")
            window.clearTimeout(assistantStateTimer);
          if (safeState !== "listening")
            window.clearTimeout(listeningTimer);
          assistantState = safeState;
          compose.dataset.assistantState = safeState;
          compose.setAttribute(
            "aria-busy",
            String(["listening", "thinking"].includes(safeState)),
          );
          mic.setAttribute(
            "aria-pressed",
            String(safeState === "listening"),
          );
          $("#trace-status").textContent =
            detail.message || assistantStateMessages[safeState];
          if (safeState === "error" && detail.reason)
            $("#trace-route").textContent = detail.reason;
        }
        function setDeviceUiState(state, detail = {}) {
          const safeState = state === "ready" ? "ready" : deviceUiStates[state] ? state : "error";
          const stage = $(".studio-stage");
          const visual = $(".studio-visual");
          const panel = $("#device-state-panel");
          const selectedDevice = devices[activeDevice];
          const deviceSwitch = $(".drawer-heading .switch");
          const deviceRange = $("#device-range");
          stage.dataset.deviceUiState = safeState;
          visual.setAttribute("aria-busy", String(safeState === "loading"));
          panel.hidden = safeState === "ready";
          deviceSwitch.disabled = safeState !== "ready";
          deviceRange.disabled = safeState !== "ready";
          if (safeState === "ready") {
            $("#control-title").textContent = selectedDevice.title;
            $("#control-subtitle").textContent = selectedDevice.subtitle;
            return;
          }
          const config = deviceUiStates[safeState];
          const drawerStateLabels = {
            loading: "Refreshing local state…",
            empty: "No selected device",
            offline: "Offline · Last state saved",
            denied: "Local network permission required",
            error: "Local service unavailable",
          };
          $("#control-title").textContent =
            safeState === "empty" ? "Device controls" : selectedDevice.title;
          $("#control-subtitle").textContent = drawerStateLabels[safeState];
          $("#device-state-icon").setAttribute(
            "href",
            `#${detail.icon || config.icon}`,
          );
          $("#device-state-kicker").textContent =
            detail.kicker || config.kicker;
          $("#device-state-title").textContent =
            detail.title ||
            (safeState === "offline"
              ? `${selectedDevice.name} is offline`
              : config.title);
          $("#device-state-copy").textContent = detail.copy || config.copy;
          const primary = $("#device-state-primary");
          primary.textContent = detail.action || config.action;
          primary.dataset.stateIntent = detail.intent || config.intent;
        }
        function navigate(viewId, updateHash = true) {
          const safe = pages[viewId] ? viewId : "home";
          document.body.dataset.currentView = safe;
          $$(".view").forEach((view) =>
            view.classList.toggle("active", view.id === safe),
          );
          $$("[data-view]").forEach((link) =>
            link.toggleAttribute("aria-current", link.dataset.view === safe),
          );
          $("#page-eyebrow").textContent = pages[safe][0];
          $("#page-title").textContent = pages[safe][1];
          if (updateHash && location.hash.slice(1) !== safe)
            history.replaceState(null, "", `#${safe}`);
          document.body.classList.remove("inspector-open", "device-index-open");
        }
        function updateDevice(id) {
          const d = devices[id] || devices.hue,
            img = $("#product-image");
          img.style.opacity = "0";
          img.style.transform = "scale(.98)";
          activeDevice = id in devices ? id : "hue";
          window.setTimeout(() => {
            img.src = imageSources[id];
            img.alt = d.alt;
            img.style.opacity = "1";
            img.style.transform = "none";
          }, 120);
          $("#product-brand").textContent = d.brand;
          $("#product-name").textContent = d.name;
          $("#product-description").textContent = d.description;
          $("#device-room").textContent = d.room;
          $("#device-category").textContent = d.category;
          $("#product-status").textContent = d.status;
          $("#control-title").textContent = d.title;
          $("#control-subtitle").textContent = d.subtitle;
          $("#range-value").textContent = `${d.level}${d.suffix}`;
          $("#range-label").textContent = d.label;
          const range = $("#device-range");
          range.min = d.min;
          range.max = d.max;
          range.value = d.level;
          paintRange(range);
          $("#preset-row").classList.toggle("hidden", !d.presets);
          $("#detail-protocol").textContent = d.protocol;
          $("#detail-model").textContent = d.model;
          $("#detail-capability").textContent = d.capability;
          $("#detail-connection").textContent = d.connection;
          $("#detail-firmware").textContent = d.firmware;
          $("#detail-power").textContent = d.hardware;
          $("#live-metric-label").textContent = d.metricLabel;
          $("#live-metric-value").textContent = d.metricValue;
          $("#live-connection").textContent = d.connection;
          $("#live-activity").textContent = d.lastActivity;
          $("#trust-protocol").textContent = d.protocol;
          $("#trust-device").textContent = d.category;
          $("#trust-copy").textContent =
            `Latest ${d.category.toLowerCase()} state was resolved locally over ${d.protocol}.`;
          $$("[data-device]").forEach((row) =>
            row.classList.toggle("active", row.dataset.device === id),
          );
          setDeviceUiState("ready");
          emitNative("device-selected", { deviceId: activeDevice });
        }
        function paintRange(range) {
          const percent =
            ((range.value - range.min) / (range.max - range.min)) * 100;
          range.style.background = `linear-gradient(90deg,var(--primary) 0 ${percent}%,var(--surface-3) ${percent}% 100%)`;
        }
        function submitAssistant(value) {
          const command = value.trim();
          if (!command) return;
          window.clearTimeout(assistantStateTimer);
          window.clearTimeout(listeningTimer);
          $("#trace-understand").textContent = "Intent understood";
          $("#trace-policy").textContent = "Checking scope";
          $("#trace-route").textContent = "Planning local tools";
          setAssistantState("thinking");
          emitNative("assistant-command", {
            command,
            mode: $("[data-ai-mode]").dataset.aiMode,
            deviceId: activeDevice,
          });
          window.setTimeout(() => {
            $("#trace-policy").textContent = "Security scope approved";
            $("#trace-route").textContent = "Ready to execute locally";
            setAssistantState("success");
            toast(
              "NEXUS AI is ready",
              `“${command}” was planned with explicit local tools.`,
            );
            assistantStateTimer = window.setTimeout(
              () => setAssistantState("idle"),
              2400,
            );
          }, 520);
          $("#assistant-input").value = "";
        }
        function showHomeMode(mode) {
          const safeMode = ["areas", "devices", "capabilities"].includes(mode)
            ? mode
            : "areas";
          $$("[data-home-mode]").forEach((button) => {
            const active = button.dataset.homeMode === safeMode;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
          });
          const labels = {
            areas: "Living room",
            devices: "All devices",
            capabilities: "By capability",
          };
          $("#ribbon-label").textContent = labels[safeMode];
          $$("[data-device]").forEach((button) => {
            const device = devices[button.dataset.device];
            const status = button.querySelector("small");
            if (!button.dataset.statusCopy)
              button.dataset.statusCopy = status.textContent.trim();
            button.hidden =
              safeMode === "areas" && button.dataset.room !== "living";
            status.textContent =
              safeMode === "capabilities"
                ? `${device.category} · ${device.protocol}`
                : button.dataset.statusCopy;
          });
          const selected = $(`[data-device="${activeDevice}"]`);
          if (safeMode === "areas" && selected?.hidden) updateDevice("nest");
          emitNative("home-mode", { mode: safeMode });
        }
        function showInspectorPanel(panelId) {
          $$("[data-inspector-tab]").forEach((button) => {
            const active = button.dataset.inspectorTab === panelId;
            button.classList.toggle("active", active);
            button.setAttribute("aria-selected", String(active));
            button.tabIndex = active ? 0 : -1;
          });
          $$("[data-inspector-panel]").forEach((panel) => {
            const active = panel.dataset.inspectorPanel === panelId;
            panel.classList.toggle("active", active);
            panel.hidden = !active;
          });
        }
        function cycleAiMode(button) {
          const current = aiModes.indexOf(button.dataset.aiMode),
            next = aiModes[(current + 1) % aiModes.length];
          button.dataset.aiMode = next;
          button.querySelector("span").textContent =
            next[0].toUpperCase() + next.slice(1);
          const explanations = {
            smart: "NEXUS chooses the safest efficient route.",
            controlled: "Only deterministic skills and actions may run.",
            agent: "NEXUS may plan multiple steps with approvals.",
          };
          toast(
            `${button.querySelector("span").textContent} mode`,
            explanations[next],
          );
          emitNative("assistant-mode", { mode: next });
        }
        function installImageFallbacks() {
          $$("img").forEach((image) =>
            image.addEventListener(
              "error",
              () => {
                const label = escapeHtml(
                  image.alt.split(" ").slice(0, 3).join(" "),
                );
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#202433"/><stop offset="1" stop-color="#0d0f15"/></linearGradient></defs><rect width="100%" height="100%" rx="32" fill="url(#g)"/><circle cx="350" cy="210" r="105" fill="#818cf8" fill-opacity=".12" stroke="#818cf8" stroke-opacity=".35"/><path d="M305 260V160l90 100V160" fill="none" stroke="#9ca6ff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><text x="350" y="365" fill="#cbd1df" font-family="Segoe UI,Arial" font-size="24" text-anchor="middle">${label}</text></svg>`;
                image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
              },
              { once: true },
            ),
          );
        }
        function windowAction(action) {
          const bridge = window.nexusDesktop?.window;
          if (bridge && typeof bridge[action] === "function") bridge[action]();
          else
            toast(
              `Window: ${action}`,
              "Connect this button to the Electron or Tauri window bridge.",
            );
        }
        function openSetting(button) {
          const key = button.dataset.setting,
            control = $("#dialog-control");
          control.replaceChildren();
          $("#dialog-title").textContent = button.dataset.label;
          $("#dialog-label").textContent = button.dataset.label;
          let input;
          if (button.dataset.type === "select") {
            input = document.createElement("select");
            button.dataset.options.split("|").forEach((value) => {
              const option = document.createElement("option");
              option.value = value;
              option.textContent = value;
              option.selected = settings[key] === value;
              input.append(option);
            });
          } else {
            input = document.createElement("input");
            input.type = "text";
            input.value = settings[key];
            input.maxLength = 64;
          }
          input.id = "dialog-input";
          input.dataset.key = key;
          input.required = true;
          control.append(input);
          $("#setting-dialog").showModal();
          window.setTimeout(() => input.focus(), 0);
        }
        async function copyText(value) {
          try {
            await navigator.clipboard.writeText(value);
          } catch {
            const area = document.createElement("textarea");
            area.value = value;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.append(area);
            area.select();
            document.execCommand("copy");
            area.remove();
          }
          toast("Checksum copied", "SHA-256 is ready to paste.");
        }

        document.addEventListener("click", (event) => {
          const nav = event.target.closest("[data-view]");
          if (nav) {
            event.preventDefault();
            navigate(nav.dataset.view);
            return;
          }
          const homeMode = event.target.closest("[data-home-mode]");
          if (homeMode) {
            showHomeMode(homeMode.dataset.homeMode);
            return;
          }
          const inspectorTab = event.target.closest("[data-inspector-tab]");
          if (inspectorTab) {
            showInspectorPanel(inspectorTab.dataset.inspectorTab);
            return;
          }
          const aiMode = event.target.closest("[data-ai-mode]");
          if (aiMode) {
            cycleAiMode(aiMode);
            return;
          }
          const homeTarget = event.target.closest("[data-home-target]");
          if (homeTarget) {
            const map = {
              living: "hue",
              office: "sonos",
              entry: "nuki",
              utility: "roborock",
            };
            showHomeMode("devices");
            updateDevice(map[homeTarget.dataset.homeTarget] || "hue");
            return;
          }
          const capability = event.target.closest("[data-capability]");
          if (capability) {
            const map = {
              lighting: "hue",
              climate: "nest",
              security: "nuki",
              energy: "roborock",
            };
            showHomeMode("devices");
            updateDevice(map[capability.dataset.capability] || "hue");
            return;
          }
          const device = event.target.closest("[data-device]");
          if (device) {
            updateDevice(device.dataset.device);
            return;
          }
          const deviceStateAction = event.target.closest(
            "[data-device-state-action]",
          );
          if (deviceStateAction) {
            if (deviceStateAction.dataset.deviceStateAction === "dismiss") {
              setDeviceUiState("ready");
              return;
            }
            const intent = $("#device-state-primary").dataset.stateIntent;
            if (intent === "permissions") {
              emitNative("open-permissions", {
                permission: "local-network",
              });
              toast(
                "Windows permissions opened",
                "Allow local network access, then return to NEXUS.",
              );
              return;
            }
            emitNative(intent === "scan" ? "device-scan" : "device-retry", {
              deviceId: activeDevice,
            });
            setDeviceUiState("loading");
            if (!window.nexusDesktop)
              window.setTimeout(() => setDeviceUiState("ready"), 900);
            return;
          }
          const room = event.target.closest(".room-tab");
          if (room) {
            $$(".room-tab").forEach((item) =>
              item.classList.toggle("active", item === room),
            );
            toast(
              `${room.textContent} selected`,
              "The device list was filtered locally.",
            );
            return;
          }
          const prompt = event.target.closest("[data-prompt]");
          if (prompt) {
            navigate("home");
            $("#assistant-input").value = prompt.dataset.prompt;
            $("#assistant-input").focus();
            return;
          }
          const switchButton = event.target.closest(".switch");
          if (switchButton) {
            const next = switchButton.getAttribute("aria-pressed") !== "true";
            switchButton.setAttribute("aria-pressed", String(next));
            emitNative("device-command", {
              deviceId: activeDevice,
              capability: "power",
              value: next,
            });
            toast(
              next ? "Device enabled" : "Device paused",
              "The Security Engine approved the local action.",
            );
            return;
          }
          const preset = event.target.closest(".preset");
          if (preset) {
            $$(".preset").forEach((item) =>
              item.classList.toggle("active", item === preset),
            );
            toast("Light temperature updated");
            return;
          }
          const setting = event.target.closest("[data-setting]");
          if (setting) {
            openSetting(setting);
            return;
          }
          const copy = event.target.closest("[data-copy]");
          if (copy) {
            copyText(copy.dataset.copy);
            return;
          }
          const message = event.target.closest("[data-toast]");
          if (message) {
            toast(message.dataset.toast);
            return;
          }
          const windowButton = event.target.closest("[data-window]");
          if (windowButton) {
            windowAction(windowButton.dataset.window);
            return;
          }
          if (event.target.closest("[data-theme-toggle]")) {
            const next =
              document.documentElement.dataset.theme === "light"
                ? "dark"
                : "light";
            document.documentElement.dataset.theme = next;
            try {
              localStorage.setItem("nexus-theme", next);
            } catch {}
            return;
          }
          if (event.target.closest("[data-mic]")) {
            window.clearTimeout(listeningTimer);
            if (assistantState === "listening") {
              setAssistantState("idle");
              emitNative("assistant-listen", { active: false });
              return;
            }
            setAssistantState("listening");
            emitNative("assistant-listen", { active: true });
            toast(
              "NEXUS AI is listening",
              "Speech is processed locally on this Windows PC.",
            );
            listeningTimer = window.setTimeout(() => {
              if (assistantState === "listening") setAssistantState("idle");
            }, 5000);
            return;
          }
          if (event.target.closest("[data-focus-assistant]")) {
            navigate("home");
            $("#assistant-input").focus();
            return;
          }
          if (event.target.closest("[data-index]")) {
            document.body.classList.toggle("device-index-open");
            return;
          }
          if (event.target.closest("[data-inspector]"))
            document.body.classList.toggle("inspector-open");
        });
        $("#device-range").addEventListener("input", (event) => {
          paintRange(event.currentTarget);
          const suffix = devices[activeDevice]?.suffix || "";
          $("#range-value").textContent =
            `${event.currentTarget.value}${suffix}`;
        });
        $("#device-range").addEventListener("change", (event) =>
          emitNative("device-command", {
            deviceId: activeDevice,
            capability: "level",
            value: Number(event.currentTarget.value),
          }),
        );
        $("#assistant-form").addEventListener("submit", (event) => {
          event.preventDefault();
          submitAssistant($("#assistant-input").value);
        });
        $("#setting-form").addEventListener("submit", (event) => {
          if (event.submitter?.value !== "save") return;
          const input = $("#dialog-input"),
            value = input.value.trim();
          if (!value) return;
          settings[input.dataset.key] = value;
          $(`[data-value="${input.dataset.key}"]`).textContent = value;
          toast(`${$("#dialog-title").textContent} updated`, value);
        });
        document.addEventListener("keydown", (event) => {
          const activeTab = event.target.closest("[data-inspector-tab]");
          if (
            activeTab &&
            ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
          ) {
            event.preventDefault();
            const tabs = $$("[data-inspector-tab]");
            const current = tabs.indexOf(activeTab);
            const nextIndex =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : event.key === "ArrowRight"
                    ? (current + 1) % tabs.length
                    : (current - 1 + tabs.length) % tabs.length;
            tabs[nextIndex].focus();
            showInspectorPanel(tabs[nextIndex].dataset.inspectorTab);
            return;
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
          ) {
            event.preventDefault();
            navigate("home");
            $("#assistant-input").focus();
          }
          if (event.key === "Escape")
            document.body.classList.remove(
              "inspector-open",
              "device-index-open",
            );
        });
        window.addEventListener("hashchange", () =>
          navigate(location.hash.slice(1), false),
        );
        window.addEventListener("nexus:assistant-state", (event) =>
          setAssistantState(event.detail?.state, event.detail),
        );
        window.addEventListener("nexus:device-ui-state", (event) =>
          setDeviceUiState(event.detail?.state, event.detail),
        );
        window.NEXUS_UI = Object.freeze({
          setAssistantState,
          setDeviceState: setDeviceUiState,
          selectDevice: updateDevice,
          navigate,
        });
        try {
          const saved = localStorage.getItem("nexus-theme");
          if (saved === "light" || saved === "dark")
            document.documentElement.dataset.theme = saved;
        } catch {}
        installImageFallbacks();
        navigate(location.hash.slice(1) || "home", false);
        showHomeMode("areas");
        showInspectorPanel("control");
        updateDevice("nest");
        setAssistantState("idle");
      })();
    