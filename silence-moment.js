(function () {
    "use strict";

    let allowClose = false;
    let isAlertOpen = false;
    let modalElement = null;
    let countdownInterval = null;
    let isInitialized = false;
    let originalOverflow = null;
    let keydownListener = null;
    let clickListener = null;

    const defaultConfig = {
        title: "Зупинись. Пам'ятай. Дій.",
        text: "Пам'ять — це дія. Це час запитати: що я роблю для перемоги? Чи достатньо? Як я можу допомогти?",
        additionalText:
            "Може варто задонатити, почати розмовляти українською або допомогти іншим? Пам'ять не пасивна — це активна участь у спільній боротьбі за майбутнє.",
        alertTitle: "Вибачте, але ні.",
        alertText:
            "Ця хвилина зупинки – для кожного українця <span class='flag-emoji'></span>",
        backgroundColor: "#009cea",
        textColor: "#fff",
        alertBackgroundColor: "#fff",
        alertTextColor: "#000",
        backgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_lg.svg",
        alertBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_alert_lg.svg",
        mobileBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_xs.svg",
        mobileAlertBackgroundImage: "https://st.work.ua/i/info_blocks/minute_of_silence/decor_alert_xs.svg",
        customStyles: "",
        modalClass: "",
        showTime: 9,
        showMinute: 0,
        showSecond: 0,
        duration: 60000,
        disableWorkLogo: false,
        zIndex: 9999999,
    };

    let config = { ...defaultConfig };

    function sanitizeCSS(css) {
        if (typeof css !== "string") return "";
        return css
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/expression\(/gi, "")
            .replace(/url\(javascript:/gi, "");
    }

    function getKyivTime() {
        try {
            return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Kyiv" }));
        } catch (e) {
            return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Kiev" }));
        }
    }

    function isTimeZoneFunctionalForKyiv() {
        const timeZones = ["Europe/Kyiv", "Europe/Kiev"];
        try {
            const testUtcMs = Date.UTC(2024, 0, 1, 12, 0, 0);
            const opts = { hour: "2-digit", day: "2-digit", hourCycle: "h23" };

            for (const tz of timeZones) {
                try {
                    const kyivParts = new Intl.DateTimeFormat("en-US", {
                        timeZone: tz,
                        ...opts,
                    }).formatToParts(testUtcMs);

                    const utcParts = new Intl.DateTimeFormat("en-US", {
                        timeZone: "UTC",
                        ...opts,
                    }).formatToParts(testUtcMs);

                    const getDayHour = (parts) => {
                        let day = null, hour = null;
                        for (const p of parts) {
                            if (p.type === "day") day = p.value;
                            if (p.type === "hour") hour = p.value;
                        }
                        return { day, hour };
                    };

                    const k = getDayHour(kyivParts);
                    const u = getDayHour(utcParts);

                    if (k.day && k.hour && u.day && u.hour) {
                        if (!(k.day === u.day && k.hour === u.hour)) {
                            return true;
                        }
                    }
                } catch {
                    continue;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    function getKyivShowTime(hour, minute, second = 0) {
        const kyivNow = getKyivTime();
        const kyivShowTime = new Date(
            kyivNow.getFullYear(),
            kyivNow.getMonth(),
            kyivNow.getDate(),
            hour,
            minute,
            second
        );
        return kyivShowTime.getTime();
    }

    function formatTime(number) {
        return number.toString().padStart(2, "0");
    }

    function createModalHTML() {
        const modalId = "silence-moment-modal";
        const modalClass = config.modalClass || "";
        const styles = `
            <style id="silence-moment-styles">
                /* ===== RESET & NORMALIZE ===== */
                #${modalId} * {
                    -webkit-box-sizing: border-box;
                    -moz-box-sizing: border-box;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                #${modalId} *::before,
                #${modalId} *::after {
                    -webkit-box-sizing: border-box;
                    -moz-box-sizing: border-box;
                    box-sizing: border-box;
                }
                
                /* ===== BASE STYLES ===== */
                #${modalId} {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: ${config.zIndex};
                    display: none;
                    font-family: Arial, sans-serif;
                    color: #1f2c47!important;
                    font-size: 18px!important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"!important;
                    line-height: 28px!important;
                }
                
                /* ===== LAYOUT COMPONENTS ===== */
                #${modalId} .silence-moment-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, .7);
                    z-index: 9999998;
                }
                
                #${modalId} .silence-moment-dialog {
                    position: relative;
                    display: -webkit-flex;
                    display: -ms-flexbox;
                    display: flex;
                    -webkit-align-items: center;
                    -ms-flex-align: center;
                    align-items: center;
                    -webkit-justify-content: center;
                    -ms-flex-pack: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    padding: 10px;
                    z-index: 9999999;
                    -webkit-box-sizing: border-box;
                    -moz-box-sizing: border-box;
                    box-sizing: border-box;
                }
                
                #${modalId} .silence-moment-content {
                    position: relative;
                    background-color: ${config.backgroundColor};
                    border: 1px solid #009cea;
                    padding-bottom: 30px;
                    background-image: ${config.backgroundImage ? `url("${config.backgroundImage}")` : 'none'};
                    background-repeat: no-repeat;
                    background-position: 85% bottom;
                    -webkit-background-size: 170px 369px;
                    -moz-background-size: 170px 369px;
                    background-size: 170px 369px;
                    -webkit-border-radius: 20px;
                    -moz-border-radius: 20px;
                    border-radius: 20px;
                    width: 750px;
                    max-width: 100%;
                    max-height: 95vh;
                    overflow: auto;
                }
                
                /* ===== HEADER SECTION ===== */
                #${modalId} .silence-moment-header {
                    padding: 20px 40px 20px 20px;
                    border-bottom: none;
                    position: relative;
                }
                
                #${modalId} .silence-moment-header h2 {
                    color: ${config.textColor};
                    margin: 0;
                    font-size: 32px;
                    line-height: 40px;
                    font-weight: bold;
                }
                
                /* ===== CLOSE BUTTON ===== */
                #${modalId} .silence-moment-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    color: white;
                    text-decoration: none;
                    font-size: 30px;
                    line-height: 20px;
                    opacity: 0.7;
                    outline: none;
                    background: transparent;
                    border: none;
                    padding: 5px;
                    -webkit-transition: opacity 0.3s;
                    -moz-transition: opacity 0.3s;
                    -o-transition: opacity 0.3s;
                    transition: opacity 0.3s;
                    cursor: pointer;
                }
                

                #${modalId} .silence-moment-close:hover,
                #${modalId} .silence-moment-close:active {
                    color: ${config.textColor} !important;
                    opacity: 1;
                }
                
                /* ===== BODY SECTION ===== */
                #${modalId} .silence-moment-body {
                    padding: 0 20px;
                    color: ${config.textColor};
                    max-width: 445px;
                }
                
                #${modalId} .silence-moment-body p {
                    font-size: 17px;
                    line-height: 24px;
                    margin: 20px 0 0;
                }
                
                /* ===== TIMER COMPONENT ===== */
                #${modalId} .silence-moment-timer {
                    display: table;
                    color: #333;
                    background: white;
                    -webkit-border-radius: 43px;
                    -moz-border-radius: 43px;
                    border-radius: 43px;
                    padding: 5px 15px;
                    width: 115px;
                    text-align: center;
                    margin-bottom: 20px;
                    white-space: nowrap;
                }
                
                #${modalId} .silence-moment-counter {
                    font-size: 24px;
                    line-height: 30px;
                    font-weight: bold;
                    margin: 0;
                    color: #737b8c;
                }
                    
                /* ===== WORK.UA LOGO ===== */
                ${!config.disableWorkLogo ? `
                #${modalId} .silence-moment-work-logo {
                    display: block;
                    height: 16px;
                    width: 80px;
                    background-image: url("https://st.work.ua/i/work-ua-job.svg");
                    background-position: center;
                    background-size: 80px 16px;
                    margin: 20px auto 0 auto;
                    opacity: 0.7;
                    transition: opacity 0.3s;
                    cursor: pointer;
                }

                #${modalId} .silence-moment-work-logo:hover {
                    opacity: 1;
                    transition: opacity 0.3s;
                }
                ` : ''}
                
                /* ===== SCREEN READER ONLY ===== */
                #${modalId} .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                    
                /* ===== ALERT COMPONENT ===== */
                #${modalId} .silence-moment-alert {
                    background-color: ${config.alertBackgroundColor};
                    -webkit-border-radius: 8px;
                    -moz-border-radius: 8px;
                    border-radius: 8px;
                    padding: 30px;
                    color: ${config.alertTextColor};
                    position: absolute;
                    top: 50px;
                    right: 72px;
                    bottom: 50px;
                    left: 72px;
                    z-index: 99999;
                    opacity: 0;
                    visibility: hidden;
                    -webkit-transition: 0.3s;
                    -moz-transition: 0.3s;
                    -o-transition: 0.3s;
                    transition: 0.3s;
                    text-align: center;
                    background-image: ${config.alertBackgroundImage ? `url("${config.alertBackgroundImage}")` : 'none'};
                    background-repeat: no-repeat;
                    background-position: center bottom;
                    -webkit-background-size: 525px 263px;
                    -moz-background-size: 525px 263px;
                    background-size: 525px 263px;
                }
                
                #${modalId} .silence-moment-alert.is-open {
                    opacity: 1;
                    visibility: visible;
                }
                
                #${modalId} .silence-moment-alert h2 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                    line-height: 40px;
                    font-weight: 700;
                    color: ${config.alertTextColor};
                }
                
                #${modalId} .silence-moment-alert p {
                    margin: 0;
                    font-size: 16px;
                    line-height: 24px;
                    color: ${config.alertTextColor};
                }
                
                /* ===== EMOJI FLAG SUPPORT ===== */
                #${modalId} .flag-emoji {
                    display: inline-block;
                    width: 1.2em;
                    height: 1.2em;
                    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzM2QyIgZD0iTTIgOC44YzAtMS42OCAwLTIuNTIuMzI3LTMuMTYyYTMgMyAwIDAgMSAxLjMxMS0xLjMxMUM0LjI4IDQgNS4xMiA0IDYuOCA0aDEwLjRjMS42OCAwIDIuNTIgMCAzLjE2Mi4zMjdhMyAzIDAgMCAxIDEuMzExIDEuMzExQzIyIDYuMjggMjIgNy4xMiAyMiA4LjhWMTJIMlY4LjhaIi8+PHBhdGggZmlsbD0iI0Y1RDYzQiIgZD0iTTIgMTJoMjB2My4yYzAgMS42OCAwIDIuNTItLjMyNyAzLjE2MmEzIDMgMCAwIDEtMS4zMTEgMS4zMTFDMTkuNzIgMjAgMTguODggMjAgMTcuMiAyMEg2LjhjLTEuNjggMC0yLjUyIDAtMy4xNjItLjMyN2EzIDMgMCAwIDEtMS4zMTEtMS4zMTFDMiAxNy43MiAyIDE2Ljg4IDIgMTUuMlYxMloiLz48L3N2Zz4=");
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    vertical-align: middle;
                }
                
                /* ===== RESPONSIVE DESIGN ===== */
                @media (max-width: 767px) {
                    #${modalId} {
                        font-size: 16px;
                        line-height: 24px;
                    }
                    
                    #${modalId} .silence-moment-dialog {
                        -webkit-align-items: flex-start;
                        -ms-flex-align: start;
                        align-items: flex-start;
                    }
                    
                    #${modalId} .silence-moment-content {
                        width: 100%;
                        -webkit-background-size: 100px 217px;
                        -moz-background-size: 100px 217px;
                        background-size: 100px 217px;
                        background-position: 90% bottom;
                        background-image: ${config.backgroundImage ? `url("${config.backgroundImage}")` : 'none'};
                    }
                    
                    #${modalId} .silence-moment-header h2 {
                        font-size: 24px;
                        line-height: 30px;
                    }
                    
                    #${modalId} .silence-moment-body {
                        max-width: 340px;
                    }
                    
                    #${modalId} .silence-moment-body p {
                        font-size: 14px;
                        line-height: 22px;
                    }
                    
                    #${modalId} .silence-moment-timer {
                        width: 85px;
                        padding: 2px 10px;
                    }
                    
                    #${modalId} .silence-moment-alert {
                        padding: 20px;
                        top: 20px;
                        right: 20px;
                        bottom: 42px;
                        left: 20px;
                        background-position: center 12px;
                    }
                    
                    #${modalId} .silence-moment-alert h2 {
                        font-size: 24px;
                        line-height: 30px;
                    }

                    ${!config.disableWorkLogo ? `
                    #${modalId} .silence-moment-work-logo {
                        margin: 20px 0 0 0;
                    }
                    ` : ''}
                }
                
                @media (max-width: 480px) {
                    #${modalId} .silence-moment-content {
                        background-image: ${config.mobileBackgroundImage ? `url("${config.mobileBackgroundImage}")` : 'none'};
                        background-position: right 30px;
                        -webkit-background-size: contain;
                        -moz-background-size: contain;
                        background-size: contain;
                    }
                    
                    #${modalId} .silence-moment-body {
                        max-width: 100%;
                        padding-right: 50px;
                    }
                    
                    #${modalId} .silence-moment-alert {
                        background-image: ${config.mobileAlertBackgroundImage ? `url("${config.mobileAlertBackgroundImage}")` : 'none'};
                        -webkit-background-size: cover;
                        -moz-background-size: cover;
                        background-size: cover;
                    }
                }
                
                /* ===== CUSTOM STYLES ===== */
                ${config.customStyles}
            </style>
        `;

        const modalHTML = `
            ${styles}
            <div id="${modalId}" class="silence-moment-modal ${modalClass}" role="dialog"${config.title ? ' aria-labelledby="silence-moment-title"' : ''}${config.text ? ' aria-describedby="silence-moment-description"' : ''} aria-modal="true">
                <div class="silence-moment-backdrop"></div>
                <div class="silence-moment-dialog">
                    <div class="silence-moment-content">
                        <div class="silence-moment-header">
                            <button class="silence-moment-close" type="button" aria-label="Закрити модальне вікно" title="Закрити">
                                <span aria-hidden="true">×</span>
                            </button>
                            ${
                                config.title
                                    ? `<h2 id="silence-moment-title">${config.title}</h2>`
                                    : ""
                            }
                        </div>
                        <div class="silence-moment-body">
                            <div class="silence-moment-timer" role="timer" aria-live="polite" aria-label="Залишилося часу">
                                <div class="silence-moment-counter" id="silence-counter">--:--</div>
                            </div>
                            ${
                                config.text
                                    ? `<p id="silence-moment-description">${config.text}</p>`
                                    : ""
                            }
                            ${
                                config.additionalText
                                    ? `<p>${config.additionalText}</p>`
                                    : ""
                            }
                            ${
                                !config.disableWorkLogo
                                    ? `<a href="https://www.work.ua/" class="silence-moment-work-logo" target="_blank" rel="noopener" title="Work.ua. Сайт пошуку роботи №1 в Україні." aria-label="Перейти на Work.ua"><span class="sr-only">Work.ua</span></a>`
                                    : ""
                            }
                        </div>
                        <div class="silence-moment-alert" id="silence-moment-close-alert" role="alert" aria-live="assertive">
                            ${
                                config.alertTitle
                                    ? `<h2>${config.alertTitle}</h2>`
                                    : ""
                            }
                            ${
                                config.alertText
                                    ? `<p>${config.alertText}</p>`
                                    : ""
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        return modalHTML;
    }

    function countdown(hideTime) {
        countdownInterval = setInterval(function () {
            const currentTime = getKyivTime();

            if (currentTime >= hideTime) {
                document.getElementById("silence-counter").innerHTML = "00:00";
                clearInterval(countdownInterval);
                return;
            }

            const timeDiffInSeconds = Math.floor(
                (hideTime - currentTime) / 1000
            );
            const minutes = Math.floor(timeDiffInSeconds / 60);
            const seconds = timeDiffInSeconds % 60;

            document.getElementById("silence-counter").innerHTML =
                formatTime(minutes) + ":" + formatTime(seconds);
        }, 1000);
    }

    function showModal(hideTime) {
        if (!modalElement) {
            const modalHTML = createModalHTML();
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modalElement = document.getElementById("silence-moment-modal");

            const closeButton = modalElement.querySelector(
                ".silence-moment-close"
            );
            if (closeButton) {
                closeButton.addEventListener("click", showCloseAlert);
            }
        }

        countdown(hideTime);

        modalElement.style.display = "block";

        if (originalOverflow === null) {
            originalOverflow = document.body.style.overflow || "";
        }
        document.body.style.overflow = "hidden";

        const timeToHide = hideTime - getKyivTime().getTime();
        if (timeToHide > 0) {
            setTimeout(hideModal, timeToHide);
        } else {
            hideModal();
        }
    }

    function hideModal() {
        allowClose = true;
        if (modalElement) {
            modalElement.style.display = "none";
        }

        if (originalOverflow !== null) {
            document.body.style.overflow = originalOverflow;
        } else {
            document.body.style.overflow = "";
        }

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
    }

    function showCloseAlert() {
        if (isAlertOpen) return;
        isAlertOpen = true;
        const alertElement = document.getElementById(
            "silence-moment-close-alert"
        );
        if (alertElement) {
            alertElement.classList.add("is-open");
            setTimeout(function () {
                alertElement.classList.remove("is-open");
                isAlertOpen = false;
            }, 2500);
        }
    }

    function checkAndScheduleModal() {
        const showTime = getKyivShowTime(
            config.showTime,
            config.showMinute,
            config.showSecond
        );
        const hideTime = showTime + config.duration;
        const now = getKyivTime().getTime();

        if (now >= showTime && now < hideTime) {
            showModal(hideTime);
        } else {
            const timeToShow =
                showTime > now
                    ? showTime - now
                    : showTime + 24 * 60 * 60 * 1000 - now;
            setTimeout(checkAndScheduleModal, timeToShow);
        }
    }

    function handleCloseAttempt(e) {
        if (!allowClose) {
            e.preventDefault();
            e.stopPropagation();
            showCloseAlert();
            return false;
        }
    }

    window.SilenceMoment = {
        init: function (userConfig = {}) {
            if (isInitialized) {
                return;
            }

            if (!isTimeZoneFunctionalForKyiv()) {
                return;
            }

            config = { ...defaultConfig, ...userConfig };

            config.customStyles = sanitizeCSS(config.customStyles);

            keydownListener = function (e) {
                if (
                    e.key === "Escape" &&
                    modalElement &&
                    modalElement.style.display === "block"
                ) {
                    handleCloseAttempt(e);
                }
            };
            document.addEventListener("keydown", keydownListener);

            clickListener = function (e) {
                if (modalElement && modalElement.style.display === "block") {
                    const content = modalElement.querySelector(
                        ".silence-moment-content"
                    );
                    if (content && !content.contains(e.target)) {
                        handleCloseAttempt(e);
                    }
                }
            };
            document.addEventListener("click", clickListener);

            checkAndScheduleModal();

            isInitialized = true;
        },

        show: function () {
            const now = getKyivTime().getTime();
            const hideTime = now + config.duration;
            showModal(hideTime);
        },

        hide: function () {
            hideModal();
        },

        showCloseAlert: function () {
            showCloseAlert();
        },

        destroy: function () {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            if (modalElement) {
                const closeButton = modalElement.querySelector(
                    ".silence-moment-close"
                );
                if (closeButton) {
                    closeButton.removeEventListener("click", showCloseAlert);
                }
                modalElement.remove();
                modalElement = null;
            }
            document.body.style.overflow = originalOverflow || "";
            document.removeEventListener("keydown", keydownListener);
            document.removeEventListener("click", clickListener);
            isInitialized = false;
        },

        getKyivTime: function () {
            return getKyivTime();
        },
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            window.SilenceMoment.init();
        });
    } else {
        window.SilenceMoment.init();
    }
})();
