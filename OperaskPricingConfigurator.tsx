import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// User request: Create a new Framer code component named OperaskPricingConfigurator for /en/campgrounds/configure with dynamic plan matching by site size, country/currency handling, Stripe Payment Link redirects only, editable plans/countries/labels/styles controls, responsive two-column-to-stack layout, and accessible form controls.

type CurrencyCode =
    | "EUR"
    | "USD"
    | "AUD"
    | "GBP"
    | "CHF"
    | "CAD"
    | "SEK"
    | "NOK"
    | "DKK"
    | "PLN"
    | "NZD"
    | "ZAR"
    | "BRL"

interface PricingPlan {
    planName: string
    minSize: number
    maxSize: number
    eurPrice: number
    usdPrice: number
    audPrice: number
    stripeEurUrl: string
    stripeUsdUrl: string
    stripeAudUrl: string
    features: string[]
}

interface CountryConfig {
    countryName: string
    countryCode: string
    defaultLanguage: string
    currencyCode: CurrencyCode
    currencySymbol: string
    isAvailable: boolean
    waitlistMessage: string
}

interface ConversionRates {
    GBP: number
    CHF: number
    CAD: number
    SEK: number
    NOK: number
    DKK: number
    PLN: number
    NZD: number
    ZAR: number
    BRL: number
}

interface MyComponentProps {
    segmentName: string
    unitLabel: string
    minSize: number
    maxSize: number
    initialSize: number
    title: string
    subtitle: string
    payLabel: string
    quoteLabel: string
    quoteUrl: string
    returnUrl: string
    plans: PricingPlan[]
    countries: CountryConfig[]
    conversionRates: ConversionRates
    backgroundColor: string
    cardColor: string
    borderColor: string
    textColor: string
    mutedTextColor: string
    accentColor: string
    radius: number
    titleFont: any
    bodyFont: any
    buttonFont: any
}

const SUPPORTED_CURRENCIES: CurrencyCode[] = [
    "EUR",
    "USD",
    "AUD",
    "GBP",
    "CHF",
    "CAD",
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "NZD",
    "ZAR",
    "BRL",
]

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    EUR: "€",
    USD: "$",
    AUD: "A$",
    GBP: "£",
    CHF: "CHF ",
    CAD: "C$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    NZD: "NZ$",
    ZAR: "R",
    BRL: "R$",
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OperaskPricingConfigurator(props: MyComponentProps) {
    const {
        segmentName,
        unitLabel,
        minSize,
        maxSize,
        initialSize,
        title,
        subtitle,
        payLabel,
        quoteLabel,
        quoteUrl,
        returnUrl,
        plans,
        countries,
        conversionRates,
        backgroundColor,
        cardColor,
        borderColor,
        textColor,
        mutedTextColor,
        accentColor,
        radius,
        titleFont,
        bodyFont,
        buttonFont,
    } = props

    const getStripePaymentUrl = React.useCallback(
        (plan: PricingPlan | null, currency: CurrencyCode): string => {
            if (!plan) return ""
            if (currency === "USD") return (plan.stripeUsdUrl || "").trim()
            if (currency === "AUD") return (plan.stripeAudUrl || "").trim()
            return (plan.stripeEurUrl || "").trim()
        },
        []
    )

    const getSafeStripeTargetUrl = React.useCallback(
        (url: string, futureReturnUrl: string): string => {
            // Preserve returnUrl control for future Stripe Payment Link configuration.
            // Stripe return behavior is configured in Stripe Dashboard for Payment Links.
            void futureReturnUrl
            return (url || "").trim()
        },
        []
    )

    const redirectToComingSoon = React.useCallback(() => {
        if (typeof window !== "undefined") {
            window.location.href = "/coming-soon"
        }
    }, [])

    const clampedInitial = React.useMemo(() => {
        const parsed = Number.isFinite(initialSize) ? initialSize : minSize
        return Math.max(minSize, Math.min(maxSize, parsed))
    }, [initialSize, minSize, maxSize])

    const [siteSize, setSiteSize] = React.useState<number>(clampedInitial)
    const [selectedCurrency, setSelectedCurrency] = React.useState<CurrencyCode>("EUR")
    const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>("")
    const [currencyTouched, setCurrencyTouched] = React.useState<boolean>(false)

    React.useEffect(() => {
        React.startTransition(() => setSiteSize(clampedInitial))
    }, [clampedInitial])

    const countriesByCode = React.useMemo(() => {
        const map = new Map<string, CountryConfig>()
        countries.forEach((country) => map.set(country.countryCode.toUpperCase(), country))
        return map
    }, [countries])

    React.useEffect(() => {
        let detectedCountryCode = ""
        if (typeof window !== "undefined") {
            const locale =
                (window.navigator.languages && window.navigator.languages[0]) ||
                window.navigator.language ||
                "en"
            const parts = locale.split("-")
            if (parts.length > 1) detectedCountryCode = parts[1].toUpperCase()
        }

        const eurCountry =
            countries.find(
                (country) =>
                    country.defaultLanguage.toLowerCase().startsWith("en") &&
                    country.currencyCode === "EUR"
            ) ||
            countries.find((country) => country.currencyCode === "EUR") ||
            countries[0]
        const matchedCountry =
            (detectedCountryCode && countriesByCode.get(detectedCountryCode)) || eurCountry

        React.startTransition(() => {
            setSelectedCountryCode(matchedCountry?.countryCode?.toUpperCase() || "")
            if (!currencyTouched) {
                const nextCurrency = matchedCountry?.currencyCode
                setSelectedCurrency(
                    nextCurrency && SUPPORTED_CURRENCIES.includes(nextCurrency)
                        ? nextCurrency
                        : "EUR"
                )
            }
        })
    }, [countries, countriesByCode, currencyTouched])

    const selectedCountry = React.useMemo(() => {
        const byCode = countriesByCode.get(selectedCountryCode.toUpperCase())
        return byCode || countries[0] || null
    }, [countries, countriesByCode, selectedCountryCode])

    const matchedPlan = React.useMemo(() => {
        return (
            plans.find(
                (plan) =>
                    Number.isFinite(siteSize) && siteSize >= plan.minSize && siteSize <= plan.maxSize
            ) || null
        )
    }, [plans, siteSize])

    const hasCustomQuoteState = !matchedPlan

    const displayedPrice = React.useMemo(() => {
        if (!matchedPlan) {
            return "Request custom quote"
        }

        if (selectedCurrency === "EUR") {
            return `${CURRENCY_SYMBOLS.EUR}${matchedPlan.eurPrice.toLocaleString()}`
        }
        if (selectedCurrency === "USD") {
            return `${CURRENCY_SYMBOLS.USD}${matchedPlan.usdPrice.toLocaleString()}`
        }
        if (selectedCurrency === "AUD") {
            return `${CURRENCY_SYMBOLS.AUD}${matchedPlan.audPrice.toLocaleString()}`
        }

        const rate = conversionRates[selectedCurrency as keyof ConversionRates]
        const converted = matchedPlan.eurPrice * (rate || 1)
        return `≈ ${CURRENCY_SYMBOLS[selectedCurrency]}${converted.toFixed(0)}`
    }, [matchedPlan, selectedCurrency, conversionRates])

    const paymentUrl = React.useMemo(
        () => getStripePaymentUrl(matchedPlan, selectedCurrency),
        [getStripePaymentUrl, matchedPlan, selectedCurrency]
    )

    const isCountryAvailable = selectedCountry?.isAvailable ?? true
    const hasCurrency = SUPPORTED_CURRENCIES.includes(selectedCurrency)
    const hasPaymentUrl = paymentUrl.trim().length > 0

    const payDisabled = !matchedPlan || !hasCurrency || !isCountryAvailable || !hasPaymentUrl

    const paymentMessage = React.useMemo(() => {
        if (!isCountryAvailable) {
            return (
                selectedCountry?.waitlistMessage ||
                "Coming soon in your region. Payment is currently unavailable here."
            )
        }
        if (!matchedPlan || !hasCurrency || !hasPaymentUrl) {
            return "Payment is not available for this selection. Please request a quote."
        }
        return ""
    }, [isCountryAvailable, selectedCountry, matchedPlan, hasCurrency, hasPaymentUrl])

    const onSliderChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = Number(event.target.value)
            React.startTransition(() => setSiteSize(value))
        },
        []
    )

    const onInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const raw = Number(event.target.value)
            if (!Number.isFinite(raw)) return
            const clamped = Math.max(minSize, Math.min(maxSize, raw))
            React.startTransition(() => setSiteSize(clamped))
        },
        [minSize, maxSize]
    )

    const onCurrencyChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value as CurrencyCode
        if (!SUPPORTED_CURRENCIES.includes(value)) return
        React.startTransition(() => {
            setCurrencyTouched(true)
            setSelectedCurrency(value)
        })
    }, [])

    const onCountryChange = React.useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const countryCode = event.target.value.toUpperCase()
            const country = countriesByCode.get(countryCode)
            React.startTransition(() => {
                setSelectedCountryCode(countryCode)
                if (!currencyTouched && country?.currencyCode) {
                    setSelectedCurrency(country.currencyCode)
                }
            })
        },
        [countriesByCode, currencyTouched]
    )

    const onPay = React.useCallback(() => {
        if (!isCountryAvailable) {
            redirectToComingSoon()
            return
        }
        if (payDisabled || !paymentUrl) return
        if (typeof window !== "undefined") {
            const targetUrl = getSafeStripeTargetUrl(paymentUrl, returnUrl)
            if (!targetUrl) return
            window.location.href = targetUrl
        }
    }, [
        isCountryAvailable,
        payDisabled,
        paymentUrl,
        getSafeStripeTargetUrl,
        returnUrl,
        redirectToComingSoon,
    ])

    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                background: backgroundColor,
                border: `1px solid ${borderColor}`,
                borderRadius: radius,
                padding: 20,
                color: textColor,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                }}
            >
                <article
                    style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: radius,
                        padding: 16,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: mutedTextColor,
                            fontSize: bodyFont.fontSize,
                            lineHeight: bodyFont.lineHeight,
                            letterSpacing: bodyFont.letterSpacing,
                            fontWeight: bodyFont.fontWeight,
                            fontStyle: bodyFont.fontStyle,
                            textAlign: bodyFont.textAlign,
                        }}
                    >
                        {segmentName}
                    </p>
                    <h3
                        style={{
                            margin: "8px 0 6px 0",
                            fontSize: titleFont.fontSize,
                            lineHeight: titleFont.lineHeight,
                            letterSpacing: titleFont.letterSpacing,
                            fontWeight: titleFont.fontWeight,
                            fontStyle: titleFont.fontStyle,
                            textAlign: titleFont.textAlign,
                        }}
                    >
                        {title}
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: mutedTextColor,
                            fontSize: bodyFont.fontSize,
                            lineHeight: bodyFont.lineHeight,
                            letterSpacing: bodyFont.letterSpacing,
                            fontWeight: bodyFont.fontWeight,
                            fontStyle: bodyFont.fontStyle,
                            textAlign: bodyFont.textAlign,
                        }}
                    >
                        {subtitle}
                    </p>

                    <div style={{ marginTop: 16 }}>
                        <label htmlFor="op-site-size-range">Site size ({unitLabel})</label>
                        <input
                            id="op-site-size-range"
                            type="range"
                            min={minSize}
                            max={maxSize}
                            value={siteSize}
                            onChange={onSliderChange}
                            style={{ width: "100%", marginTop: 8, accentColor }}
                        />
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label htmlFor="op-site-size-input">Exact site size</label>
                        <input
                            id="op-site-size-input"
                            type="number"
                            min={minSize}
                            max={maxSize}
                            value={siteSize}
                            onChange={onInputChange}
                            style={{
                                width: "100%",
                                marginTop: 8,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 10,
                                padding: "10px 12px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label htmlFor="op-country">Country</label>
                        <select
                            id="op-country"
                            value={selectedCountryCode}
                            onChange={onCountryChange}
                            style={{
                                width: "100%",
                                marginTop: 8,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 10,
                                padding: "10px 12px",
                            }}
                        >
                            {countries.map((country) => (
                                <option
                                    key={country.countryCode}
                                    value={country.countryCode.toUpperCase()}
                                >
                                    {country.countryName} ({country.currencyCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label htmlFor="op-currency">Currency</label>
                        <select
                            id="op-currency"
                            value={selectedCurrency}
                            onChange={onCurrencyChange}
                            style={{
                                width: "100%",
                                marginTop: 8,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 10,
                                padding: "10px 12px",
                            }}
                        >
                            {SUPPORTED_CURRENCIES.map((currency) => (
                                <option key={currency} value={currency}>
                                    {currency}
                                </option>
                            ))}
                        </select>
                    </div>
                </article>

                <article
                    style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: radius,
                        padding: 16,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <p style={{ margin: 0, color: mutedTextColor }}>Matched plan</p>
                    <h3 style={{ margin: "8px 0" }}>
                        {matchedPlan ? matchedPlan.planName : "Request custom quote"}
                    </h3>
                    <p style={{ margin: "0 0 12px 0", color: mutedTextColor }}>
                        {matchedPlan
                            ? `${matchedPlan.minSize}–${matchedPlan.maxSize} ${unitLabel}`
                            : `Outside ${minSize}–${maxSize} ${unitLabel}`}
                    </p>

                    <div
                        style={{
                            fontSize: 28,
                            lineHeight: 1.1,
                            fontWeight: 700,
                            marginBottom: 12,
                        }}
                    >
                        {displayedPrice}
                    </div>

                    {matchedPlan?.features?.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18, color: mutedTextColor, flex: 1 }}>
                            {matchedPlan.features.map((feature, index) => (
                                <li key={`${feature}-${index}`} style={{ marginBottom: 6 }}>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ color: mutedTextColor, flex: 1 }}>
                            {hasCustomQuoteState
                                ? "Custom setup may be required for this segment size."
                                : "No plan features listed."}
                        </div>
                    )}

                    {paymentMessage ? (
                        <p
                            role="status"
                            style={{ margin: "12px 0 0 0", color: mutedTextColor, minHeight: 20 }}
                        >
                            {paymentMessage}
                        </p>
                    ) : (
                        <div style={{ minHeight: 20 }} />
                    )}
                    {!hasPaymentUrl && matchedPlan ? (
                        <p
                            style={{
                                margin: "8px 0 0 0",
                                color: mutedTextColor,
                                fontSize: bodyFont.fontSize,
                            }}
                        >
                            Stripe return behavior is configured in Stripe Payment Links.
                        </p>
                    ) : null}

                    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={onPay}
                            disabled={payDisabled}
                            aria-disabled={payDisabled}
                            style={{
                                border: "none",
                                borderRadius: 10,
                                padding: "11px 14px",
                                background: accentColor,
                                color: "#FFFFFF",
                                cursor: payDisabled ? "not-allowed" : "pointer",
                                opacity: payDisabled ? 0.45 : 1,
                                fontSize: buttonFont.fontSize,
                                lineHeight: buttonFont.lineHeight,
                                letterSpacing: buttonFont.letterSpacing,
                                fontWeight: buttonFont.fontWeight,
                                fontStyle: buttonFont.fontStyle,
                                textAlign: buttonFont.textAlign,
                            }}
                        >
                            {payLabel}
                        </button>
                        <a
                            href={quoteUrl}
                            style={{
                                borderRadius: 10,
                                padding: "10px 14px",
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                                textDecoration: "none",
                                fontSize: buttonFont.fontSize,
                                lineHeight: buttonFont.lineHeight,
                                letterSpacing: buttonFont.letterSpacing,
                                fontWeight: buttonFont.fontWeight,
                                fontStyle: buttonFont.fontStyle,
                                textAlign: buttonFont.textAlign,
                            }}
                        >
                            {quoteLabel}
                        </a>
                    </div>
                </article>
            </div>
        </section>
    )
}

addPropertyControls(OperaskPricingConfigurator, {
    segmentName: { type: ControlType.String, defaultValue: "Campgrounds Segment" },
    unitLabel: { type: ControlType.String, defaultValue: "sites" },
    minSize: { type: ControlType.Number, defaultValue: 10, min: 1, max: 5000, step: 1 },
    maxSize: { type: ControlType.Number, defaultValue: 500, min: 1, max: 5000, step: 1 },
    initialSize: { type: ControlType.Number, defaultValue: 75, min: 1, max: 5000, step: 1 },
    title: { type: ControlType.String, defaultValue: "Configure your pricing" },
    subtitle: {
        type: ControlType.String,
        defaultValue: "Adjust site size, review your tier, and continue to checkout.",
        displayTextArea: true,
    },
    payLabel: { type: ControlType.String, defaultValue: "Continue to payment" },
    quoteLabel: { type: ControlType.String, defaultValue: "Request Quote" },
    quoteUrl: { type: ControlType.Link, defaultValue: "/en/campgrounds/quote" },
    returnUrl: { type: ControlType.Link, defaultValue: "/thank-you" },
    plans: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                planName: { type: ControlType.String, defaultValue: "Starter" },
                minSize: { type: ControlType.Number, defaultValue: 10, min: 0, max: 99999, step: 1 },
                maxSize: { type: ControlType.Number, defaultValue: 50, min: 0, max: 99999, step: 1 },
                eurPrice: { type: ControlType.Number, defaultValue: 250, min: 0, step: 1 },
                usdPrice: { type: ControlType.Number, defaultValue: 310, min: 0, step: 1 },
                audPrice: { type: ControlType.Number, defaultValue: 410, min: 0, step: 1 },
                stripeEurUrl: { type: ControlType.Link, defaultValue: "" },
                stripeUsdUrl: { type: ControlType.Link, defaultValue: "" },
                stripeAudUrl: { type: ControlType.Link, defaultValue: "" },
                features: {
                    type: ControlType.Array,
                    control: { type: ControlType.String, defaultValue: "Feature" },
                    defaultValue: ["Core booking features", "Email support"],
                },
            },
        },
        defaultValue: [
            {
                planName: "Starter",
                minSize: 10,
                maxSize: 50,
                eurPrice: 250,
                usdPrice: 310,
                audPrice: 410,
                stripeEurUrl: "",
                stripeUsdUrl: "",
                stripeAudUrl: "",
                features: ["Core booking features", "Email support"],
            },
            {
                planName: "Growth",
                minSize: 51,
                maxSize: 150,
                eurPrice: 400,
                usdPrice: 500,
                audPrice: 660,
                stripeEurUrl: "",
                stripeUsdUrl: "",
                stripeAudUrl: "",
                features: ["Advanced reporting", "Priority email support"],
            },
            {
                planName: "Pro",
                minSize: 151,
                maxSize: 300,
                eurPrice: 620,
                usdPrice: 780,
                audPrice: 1020,
                stripeEurUrl: "",
                stripeUsdUrl: "",
                stripeAudUrl: "",
                features: ["Automation workflows", "Priority support"],
            },
            {
                planName: "Enterprise",
                minSize: 301,
                maxSize: 500,
                eurPrice: 910,
                usdPrice: 1140,
                audPrice: 1500,
                stripeEurUrl: "",
                stripeUsdUrl: "",
                stripeAudUrl: "",
                features: ["Dedicated onboarding", "Account management"],
            },
        ],
    },
    countries: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                countryName: { type: ControlType.String, defaultValue: "United Kingdom" },
                countryCode: { type: ControlType.String, defaultValue: "GB" },
                defaultLanguage: { type: ControlType.String, defaultValue: "en" },
                currencyCode: {
                    type: ControlType.Enum,
                    options: SUPPORTED_CURRENCIES,
                    defaultValue: "GBP",
                },
                currencySymbol: { type: ControlType.String, defaultValue: "£" },
                isAvailable: { type: ControlType.Boolean, defaultValue: true },
                waitlistMessage: {
                    type: ControlType.String,
                    defaultValue: "Coming soon in your region. Join the waitlist.",
                },
            },
        },
        defaultValue: [
            {
                countryName: "Germany",
                countryCode: "DE",
                defaultLanguage: "de",
                currencyCode: "EUR",
                currencySymbol: "€",
                isAvailable: true,
                waitlistMessage: "Coming soon in your region. Join the waitlist.",
            },
            {
                countryName: "United States",
                countryCode: "US",
                defaultLanguage: "en",
                currencyCode: "USD",
                currencySymbol: "$",
                isAvailable: true,
                waitlistMessage: "Coming soon in your region. Join the waitlist.",
            },
            {
                countryName: "Australia",
                countryCode: "AU",
                defaultLanguage: "en",
                currencyCode: "AUD",
                currencySymbol: "A$",
                isAvailable: true,
                waitlistMessage: "Coming soon in your region. Join the waitlist.",
            },
            {
                countryName: "United Kingdom",
                countryCode: "GB",
                defaultLanguage: "en",
                currencyCode: "GBP",
                currencySymbol: "£",
                isAvailable: true,
                waitlistMessage: "Coming soon in your region. Join the waitlist.",
            },
        ],
    },
    conversionRates: {
        type: ControlType.Object,
        controls: {
            GBP: { type: ControlType.Number, defaultValue: 0.86, min: 0, step: 0.01 },
            CHF: { type: ControlType.Number, defaultValue: 0.96, min: 0, step: 0.01 },
            CAD: { type: ControlType.Number, defaultValue: 1.47, min: 0, step: 0.01 },
            SEK: { type: ControlType.Number, defaultValue: 11.2, min: 0, step: 0.1 },
            NOK: { type: ControlType.Number, defaultValue: 11.6, min: 0, step: 0.1 },
            DKK: { type: ControlType.Number, defaultValue: 7.45, min: 0, step: 0.01 },
            PLN: { type: ControlType.Number, defaultValue: 4.3, min: 0, step: 0.1 },
            NZD: { type: ControlType.Number, defaultValue: 1.78, min: 0, step: 0.01 },
            ZAR: { type: ControlType.Number, defaultValue: 19.2, min: 0, step: 0.1 },
            BRL: { type: ControlType.Number, defaultValue: 5.9, min: 0, step: 0.1 },
        },
        defaultValue: {
            GBP: 0.86,
            CHF: 0.96,
            CAD: 1.47,
            SEK: 11.2,
            NOK: 11.6,
            DKK: 7.45,
            PLN: 4.3,
            NZD: 1.78,
            ZAR: 19.2,
            BRL: 5.9,
        },
    },
    backgroundColor: { type: ControlType.Color, defaultValue: "#F8FAFC" },
    cardColor: { type: ControlType.Color, defaultValue: "#FFFFFF" },
    borderColor: { type: ControlType.Color, defaultValue: "#E2E8F0" },
    textColor: { type: ControlType.Color, defaultValue: "#0F172A" },
    mutedTextColor: { type: ControlType.Color, defaultValue: "#475569" },
    accentColor: { type: ControlType.Color, defaultValue: "#0F172A" },
    radius: { type: ControlType.Number, defaultValue: 16, min: 0, max: 40, step: 1 },
    titleFont: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})