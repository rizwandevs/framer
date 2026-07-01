import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import type { ComponentType } from "react"

// User request: Create a new code file with a named override withOperaskLanguageRouting for header language selects and a code component OperaskLanguageSwitcher for footer insertion, including Operask URL/language mapping, localStorage persistence, browser-language first-visit redirect, same-tab routing, and compact configurable footer select.

type LanguageCode = "fr" | "en" | "es"

interface LanguageOption {
    code: LanguageCode
    label: string
}

interface MyComponentProps {
    compact: boolean
    backgroundColor: string
    borderColor: string
    textColor: string
    radius: number
}

const STORAGE_KEY = "operask_language"

const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
]

const ROUTE_MAP: Record<string, Record<LanguageCode, string>> = {
    home: { fr: "/", en: "/en", es: "/es" },
    campgrounds: { fr: "/camping", en: "/en/campgrounds", es: "/es/campings" },
    marinas: { fr: "/ports", en: "/en/marinas", es: "/es/puertos-deportivos" },
    racecourses: { fr: "/hippodromes", en: "/en/racecourses", es: "/es/hipodromos" },
    christmasMarkets: {
        fr: "/marches-de-noel",
        en: "/en/christmas-markets",
        es: "/es/mercados-navidenos",
    },
    parks: { fr: "/parcs", en: "/en/parks", es: "/es/parques" },
    zoos: { fr: "/zoos", en: "/en/zoos", es: "/es/zoos" },
    privateSites: { fr: "/sites-prives", en: "/en/private-sites", es: "/es/sitios-privados" },
    configureCampgrounds: {
        fr: "/camping/configure",
        en: "/en/campgrounds/configure",
        es: "/es/campings/configure",
    },
    configureMarinas: {
        fr: "/ports/configure",
        en: "/en/marinas/configure",
        es: "/es/puertos-deportivos/configure",
    },
    configureRacecourses: {
        fr: "/hippodromes/configure",
        en: "/en/racecourses/configure",
        es: "/es/hipodromos/configure",
    },
    configureChristmasMarkets: {
        fr: "/marches-de-noel/configure",
        en: "/en/christmas-markets/configure",
        es: "/es/mercados-navidenos/configure",
    },
    configureParks: {
        fr: "/parcs/configure",
        en: "/en/parks/configure",
        es: "/es/parques/configure",
    },
    configureZoos: { fr: "/zoos/configure", en: "/en/zoos/configure", es: "/es/zoos/configure" },
    configurePrivateSites: {
        fr: "/sites-prives/configure",
        en: "/en/private-sites/configure",
        es: "/es/sitios-privados/configure",
    },
    quoteCampgrounds: {
        fr: "/camping/quote",
        en: "/en/campgrounds/quote",
        es: "/es/campings/quote",
    },
    quoteMarinas: {
        fr: "/ports/quote",
        en: "/en/marinas/quote",
        es: "/es/puertos-deportivos/quote",
    },
    quoteRacecourses: {
        fr: "/hippodromes/quote",
        en: "/en/racecourses/quote",
        es: "/es/hipodromos/quote",
    },
    quoteChristmasMarkets: {
        fr: "/marches-de-noel/quote",
        en: "/en/christmas-markets/quote",
        es: "/es/mercados-navidenos/quote",
    },
    quoteParks: { fr: "/parcs/quote", en: "/en/parks/quote", es: "/es/parques/quote" },
    quoteZoos: { fr: "/zoos/quote", en: "/en/zoos/quote", es: "/es/zoos/quote" },
    quotePrivateSites: {
        fr: "/sites-prives/quote",
        en: "/en/private-sites/quote",
        es: "/es/sitios-privados/quote",
    },
    contact: { fr: "/contact", en: "/en/contact", es: "/es/contact" },
    comingSoon: { fr: "/coming-soon", en: "/en/coming-soon", es: "/es/coming-soon" },
    thankYou: { fr: "/thank-you", en: "/en/thank-you", es: "/es/thank-you" },
}

function normalizePath(pathname: string): string {
    if (!pathname) return "/"
    const cleaned = pathname.replace(/\/+$/, "")
    return cleaned || "/"
}

function getLanguageFromPath(pathname: string): LanguageCode {
    const path = normalizePath(pathname)
    if (path === "/en" || path.startsWith("/en/")) return "en"
    if (path === "/es" || path.startsWith("/es/")) return "es"
    return "fr"
}

function hasExplicitLanguagePrefix(pathname: string): boolean {
    const path = normalizePath(pathname)
    return path === "/en" || path.startsWith("/en/") || path === "/es" || path.startsWith("/es/")
}

function stripLanguagePrefix(pathname: string): string {
    const path = normalizePath(pathname)
    if (path === "/en" || path === "/es") return "/"
    if (path.startsWith("/en/")) return path.slice(3) || "/"
    if (path.startsWith("/es/")) return path.slice(3) || "/"
    return path
}

function inferBrowserLanguage(): LanguageCode {
    if (typeof window === "undefined") return "en"
    const locale =
        (window.navigator.languages && window.navigator.languages[0]) ||
        window.navigator.language ||
        "en"
    const lowered = locale.toLowerCase()
    if (lowered.startsWith("fr")) return "fr"
    if (lowered.startsWith("es")) return "es"
    if (lowered.startsWith("en")) return "en"
    return "en"
}

function resolveLanguage(value: string): LanguageCode {
    if (value === "fr" || value === "en" || value === "es") return value
    return "en"
}

function matchKnownRoute(pathname: string): string | null {
    const current = normalizePath(pathname)
    for (const key of Object.keys(ROUTE_MAP)) {
        const routes = ROUTE_MAP[key]
        if (
            normalizePath(routes.fr) === current ||
            normalizePath(routes.en) === current ||
            normalizePath(routes.es) === current
        ) {
            return key
        }
    }
    return null
}

function buildUnknownRoute(pathname: string, targetLanguage: LanguageCode): string {
    const base = stripLanguagePrefix(pathname)
    if (targetLanguage === "fr") return base
    return `${targetLanguage === "en" ? "/en" : "/es"}${base === "/" ? "" : base}`
}

function getEquivalentRoute(pathname: string, targetLanguage: LanguageCode): string {
    const routeKey = matchKnownRoute(pathname)
    if (routeKey) {
        const translated = ROUTE_MAP[routeKey][targetLanguage]
        if (translated) return translated
        return ROUTE_MAP[routeKey].en || "/en"
    }
    return buildUnknownRoute(pathname, targetLanguage)
}

function navigateToLanguage(targetLanguage: LanguageCode): void {
    if (typeof window === "undefined") return
    const { pathname, search, hash } = window.location
    const nextPath = getEquivalentRoute(pathname, targetLanguage)
    window.location.href = `${nextPath}${search}${hash}`
}

function parseLanguageSelection(value: string): LanguageCode {
    const lowered = value.toLowerCase()
    if (lowered === "fr" || lowered === "français") return "fr"
    if (lowered === "es" || lowered === "español" || lowered === "espanol") return "es"
    if (lowered === "en" || lowered === "english") return "en"
    return "en"
}

function runInitialLanguageRouting(): LanguageCode {
    if (typeof window === "undefined") return "fr"
    const { pathname } = window.location
    const currentFromUrl = getLanguageFromPath(pathname)
    const hasExplicitPrefix = hasExplicitLanguagePrefix(pathname)
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved && !hasExplicitPrefix) {
        const browserLanguage = inferBrowserLanguage()
        window.localStorage.setItem(STORAGE_KEY, browserLanguage)
        if (browserLanguage !== currentFromUrl) navigateToLanguage(browserLanguage)
        return browserLanguage
    }

    if (saved && !hasExplicitPrefix) {
        const preferred = resolveLanguage(saved)
        if (preferred !== currentFromUrl) navigateToLanguage(preferred)
        return preferred
    }

    window.localStorage.setItem(STORAGE_KEY, currentFromUrl)
    return currentFromUrl
}

export function withOperaskLanguageRouting(Component: ComponentType<any>): ComponentType {
    return function OperaskLanguageRoutingOverride(props: any): JSX.Element {
        const [language, setLanguage] = React.useState<LanguageCode>("fr")

        React.useEffect(() => {
            const next = runInitialLanguageRouting()
            React.startTransition(() => setLanguage(next))
        }, [])

        const handleChange = React.useCallback(
            (event: any) => {
                const raw = event?.target?.value ?? ""
                const nextLanguage = parseLanguageSelection(String(raw))
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(STORAGE_KEY, nextLanguage)
                }
                React.startTransition(() => setLanguage(nextLanguage))
                if (props.onChange) props.onChange(event)
                navigateToLanguage(nextLanguage)
            },
            [props]
        )

        return <Component {...props} value={language} onChange={handleChange} />
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OperaskLanguageSwitcher(props: MyComponentProps) {
    const { compact, backgroundColor, borderColor, textColor, radius } = props
    const [language, setLanguage] = React.useState<LanguageCode>("fr")

    React.useEffect(() => {
        const next = runInitialLanguageRouting()
        React.startTransition(() => setLanguage(next))
    }, [])

    const onChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLanguage = parseLanguageSelection(event.target.value)
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, nextLanguage)
        }
        React.startTransition(() => setLanguage(nextLanguage))
        navigateToLanguage(nextLanguage)
    }, [])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                minWidth: compact ? 120 : 180,
            }}
        >
            <label
                htmlFor="operask-language-switcher"
                style={{
                    display: "block",
                    fontSize: 12,
                    color: textColor,
                    opacity: 0.85,
                    marginBottom: 6,
                }}
            >
                Language
            </label>
            <select
                id="operask-language-switcher"
                value={language}
                onChange={onChange}
                aria-label="Select language"
                style={{
                    width: "100%",
                    height: compact ? 36 : 42,
                    padding: compact ? "6px 10px" : "8px 12px",
                    borderRadius: radius,
                    border: `1px solid ${borderColor}`,
                    background: backgroundColor,
                    color: textColor,
                    boxSizing: "border-box",
                    outline: "none",
                }}
            >
                {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

addPropertyControls(OperaskLanguageSwitcher, {
    compact: {
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "rgba(15, 23, 42, 0.55)",
    },
    borderColor: {
        type: ControlType.Color,
        defaultValue: "#334155",
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#E2E8F0",
    },
    radius: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
    },
})