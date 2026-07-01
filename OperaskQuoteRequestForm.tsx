import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// User request: Create a new Framer code component named OperaskQuoteRequestForm for /en/:Segments/quote with validation, dynamic prefill from controls/query/browser locale, success + redirect behavior, and future-ready submissionEndpoint/adminEmail controls without faking CMS save or admin email wiring.

interface MyComponentProps {
    segmentName: string
    language: string
    defaultCountry: string
    defaultCurrency: string
    thankYouUrl: string
    submissionEndpoint: string
    adminEmail: string
    title: string
    submitLabel: string
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

interface FormState {
    fullName: string
    email: string
    companyName: string
    country: string
    segment: string
    siteSize: string
    projectRequirements: string
    phone: string
    budget: string
    expectedLaunchDate: string
    additionalNotes: string
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OperaskQuoteRequestForm(props: MyComponentProps) {
    const {
        segmentName,
        language,
        defaultCountry,
        defaultCurrency,
        thankYouUrl,
        submissionEndpoint,
        adminEmail,
        title,
        submitLabel,
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

    const [form, setForm] = React.useState<FormState>({
        fullName: "",
        email: "",
        companyName: "",
        country: defaultCountry,
        segment: segmentName,
        siteSize: "",
        projectRequirements: "",
        phone: "",
        budget: "",
        expectedLaunchDate: "",
        additionalNotes: "",
    })
    const [languageCode, setLanguageCode] = React.useState<string>(language || "English")
    const [currencyCode, setCurrencyCode] = React.useState<string>(defaultCurrency || "EUR")
    const [selectedPlan, setSelectedPlan] = React.useState<string>("")
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [status, setStatus] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
    const [didSucceed, setDidSucceed] = React.useState<boolean>(false)
    const redirectTimer = React.useRef<number | null>(null)

    const detectCountryFromLocale = React.useCallback((): string => {
        if (typeof window !== "undefined") {
            const locale =
                (window.navigator.languages && window.navigator.languages[0]) ||
                window.navigator.language ||
                ""
            const region = locale.split("-")[1]
            if (region) return region.toUpperCase()
        }
        return ""
    }, [])

    const parseQueryParams = React.useCallback(() => {
        if (typeof window === "undefined") {
            return new URLSearchParams("")
        }
        return new URLSearchParams(window.location.search)
    }, [])

    React.useEffect(() => {
        const params = parseQueryParams()
        const querySegment = params.get("segment") || ""
        const queryLanguage = params.get("lang") || ""
        const queryCountry = params.get("country") || ""
        const queryCurrency = params.get("currency") || ""
        const querySiteSize = params.get("siteSize") || params.get("size") || ""
        const queryBudget = params.get("budget") || ""
        const queryPlan = params.get("plan") || ""

        const detectedCountry = detectCountryFromLocale()
        const nextCountry = queryCountry || detectedCountry || defaultCountry
        const nextSegment = querySegment || segmentName
        const nextLanguage = queryLanguage || language || "English"
        const nextCurrency = queryCurrency || defaultCurrency || "EUR"

        React.startTransition(() => {
            setLanguageCode(nextLanguage)
            setCurrencyCode(nextCurrency)
            setSelectedPlan(queryPlan)
            setForm((previous) => ({
                ...previous,
                country: nextCountry,
                segment: nextSegment,
                siteSize: querySiteSize || previous.siteSize,
                budget: queryBudget || previous.budget,
            }))
        })
    }, [defaultCountry, defaultCurrency, detectCountryFromLocale, language, parseQueryParams, segmentName])

    React.useEffect(() => {
        return () => {
            if (redirectTimer.current !== null && typeof window !== "undefined") {
                window.clearTimeout(redirectTimer.current)
            }
        }
    }, [])

    const inputBaseStyle = React.useMemo(
        () => ({
            width: "100%",
            border: `1px solid ${borderColor}`,
            borderRadius: Math.max(8, radius - 6),
            background: "#FFFFFF",
            padding: "10px 12px",
            color: textColor,
            boxSizing: "border-box" as const,
            fontSize: bodyFont.fontSize,
            lineHeight: bodyFont.lineHeight,
            letterSpacing: bodyFont.letterSpacing,
            fontWeight: bodyFont.fontWeight,
            fontStyle: bodyFont.fontStyle,
            textAlign: bodyFont.textAlign,
        }),
        [borderColor, radius, textColor, bodyFont]
    )

    const validate = React.useCallback(() => {
        const nextErrors: Record<string, string> = {}
        if (!form.fullName.trim()) nextErrors.fullName = "Please enter your full name."
        if (!form.email.trim()) nextErrors.email = "Please enter your email address."
        if (!form.companyName.trim()) nextErrors.companyName = "Please enter your company name."
        if (!form.country.trim()) nextErrors.country = "Please select your country."
        if (!form.segment.trim()) nextErrors.segment = "Please provide your segment."
        if (!form.siteSize.trim()) nextErrors.siteSize = "Please enter your site size."
        if (!form.projectRequirements.trim()) {
            nextErrors.projectRequirements = "Please describe your project requirements."
        }
        return nextErrors
    }, [form])

    const updateField = React.useCallback(
        (field: keyof FormState, value: string) => {
            React.startTransition(() => {
                setForm((previous) => ({ ...previous, [field]: value }))
                setErrors((previous) => {
                    if (!previous[field]) return previous
                    const next = { ...previous }
                    delete next[field]
                    return next
                })
            })
        },
        []
    )

    const handleSubmit = React.useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const validationErrors = validate()
            if (Object.keys(validationErrors).length > 0) {
                React.startTransition(() => {
                    setErrors(validationErrors)
                    setStatus("")
                })
                return
            }

            React.startTransition(() => {
                setIsSubmitting(true)
                setStatus("")
            })

            const sourcePage =
                typeof window !== "undefined" ? window.location.pathname : "/en/:Segments/quote"
            const payload = {
                ...form,
                language: languageCode || "English",
                currency: currencyCode || "EUR",
                selectedPlan,
                adminEmail,
                sourcePage,
                submittedAt: new Date().toISOString(),
            }

            try {
                if (submissionEndpoint.trim()) {
                    const response = await fetch(submissionEndpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    })
                    if (!response.ok) {
                        throw new Error("Submission failed")
                    }
                    React.startTransition(() => {
                        setDidSucceed(true)
                        setStatus("Quote request submitted successfully. Redirecting…")
                    })
                } else {
                    React.startTransition(() => {
                        setDidSucceed(true)
                        setStatus(
                            "Form submitted locally. This form is ready for backend wiring; connect an endpoint for CMS save/admin email automation."
                        )
                    })
                }

                if (typeof window !== "undefined") {
                    redirectTimer.current = window.setTimeout(() => {
                        window.location.href = thankYouUrl || "/thank-you"
                    }, 1200)
                }
            } catch (error) {
                React.startTransition(() => {
                    setStatus("Unable to submit right now. Please try again or request a quote directly.")
                })
            } finally {
                React.startTransition(() => setIsSubmitting(false))
            }
        },
        [
            validate,
            form,
            languageCode,
            currencyCode,
            selectedPlan,
            adminEmail,
            submissionEndpoint,
            thankYouUrl,
        ]
    )

    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                background: backgroundColor,
                borderRadius: radius,
                border: `1px solid ${borderColor}`,
                padding: 20,
                color: textColor,
                boxSizing: "border-box",
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
                <h2
                    style={{
                        margin: 0,
                        fontSize: titleFont.fontSize,
                        lineHeight: titleFont.lineHeight,
                        letterSpacing: titleFont.letterSpacing,
                        fontWeight: titleFont.fontWeight,
                        fontStyle: titleFont.fontStyle,
                        textAlign: titleFont.textAlign,
                    }}
                >
                    {title}
                </h2>
                <p
                    style={{
                        margin: "8px 0 0 0",
                        color: mutedTextColor,
                        fontSize: bodyFont.fontSize,
                        lineHeight: bodyFont.lineHeight,
                        letterSpacing: bodyFont.letterSpacing,
                        fontWeight: bodyFont.fontWeight,
                        fontStyle: bodyFont.fontStyle,
                        textAlign: bodyFont.textAlign,
                    }}
                >
                    Language: {languageCode} · Currency: {currencyCode}
                    {selectedPlan ? ` · Plan: ${selectedPlan}` : ""}
                </p>

                <form onSubmit={handleSubmit} noValidate style={{ marginTop: 16 }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 12,
                        }}
                    >
                        <label>
                            <span>Full Name</span>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={(e) => updateField("fullName", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.fullName)}
                            />
                            {errors.fullName ? <small style={{ color: "#b91c1c" }}>{errors.fullName}</small> : null}
                        </label>

                        <label>
                            <span>Email</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.email)}
                            />
                            {errors.email ? <small style={{ color: "#b91c1c" }}>{errors.email}</small> : null}
                        </label>

                        <label>
                            <span>Company Name</span>
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={(e) => updateField("companyName", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.companyName)}
                            />
                            {errors.companyName ? (
                                <small style={{ color: "#b91c1c" }}>{errors.companyName}</small>
                            ) : null}
                        </label>

                        <label>
                            <span>Country</span>
                            <input
                                type="text"
                                value={form.country}
                                onChange={(e) => updateField("country", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.country)}
                            />
                            {errors.country ? <small style={{ color: "#b91c1c" }}>{errors.country}</small> : null}
                        </label>

                        <label>
                            <span>Segment</span>
                            <input
                                type="text"
                                value={form.segment}
                                onChange={(e) => updateField("segment", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.segment)}
                            />
                            {errors.segment ? <small style={{ color: "#b91c1c" }}>{errors.segment}</small> : null}
                        </label>

                        <label>
                            <span>Site Size</span>
                            <input
                                type="number"
                                value={form.siteSize}
                                onChange={(e) => updateField("siteSize", e.target.value)}
                                style={inputBaseStyle}
                                aria-invalid={Boolean(errors.siteSize)}
                            />
                            {errors.siteSize ? <small style={{ color: "#b91c1c" }}>{errors.siteSize}</small> : null}
                        </label>

                        <label>
                            <span>Phone (Optional)</span>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                style={inputBaseStyle}
                            />
                        </label>

                        <label>
                            <span>Budget (Optional)</span>
                            <input
                                type="text"
                                value={form.budget}
                                onChange={(e) => updateField("budget", e.target.value)}
                                style={inputBaseStyle}
                            />
                        </label>

                        <label>
                            <span>Expected Launch Date (Optional)</span>
                            <input
                                type="date"
                                value={form.expectedLaunchDate}
                                onChange={(e) => updateField("expectedLaunchDate", e.target.value)}
                                style={inputBaseStyle}
                            />
                        </label>
                    </div>

                    <label style={{ display: "block", marginTop: 12 }}>
                        <span>Project Requirements</span>
                        <textarea
                            value={form.projectRequirements}
                            onChange={(e) => updateField("projectRequirements", e.target.value)}
                            rows={4}
                            style={{ ...inputBaseStyle, resize: "vertical" as const }}
                            aria-invalid={Boolean(errors.projectRequirements)}
                        />
                        {errors.projectRequirements ? (
                            <small style={{ color: "#b91c1c" }}>{errors.projectRequirements}</small>
                        ) : null}
                    </label>

                    <label style={{ display: "block", marginTop: 12 }}>
                        <span>Additional Notes (Optional)</span>
                        <textarea
                            value={form.additionalNotes}
                            onChange={(e) => updateField("additionalNotes", e.target.value)}
                            rows={3}
                            style={{ ...inputBaseStyle, resize: "vertical" as const }}
                        />
                    </label>

                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            aria-disabled={isSubmitting}
                            style={{
                                border: "none",
                                borderRadius: Math.max(8, radius - 6),
                                padding: "12px 14px",
                                background: accentColor,
                                color: "#FFFFFF",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                opacity: isSubmitting ? 0.55 : 1,
                                fontSize: buttonFont.fontSize,
                                lineHeight: buttonFont.lineHeight,
                                letterSpacing: buttonFont.letterSpacing,
                                fontWeight: buttonFont.fontWeight,
                                fontStyle: buttonFont.fontStyle,
                                textAlign: buttonFont.textAlign,
                                width: "100%",
                            }}
                        >
                            {isSubmitting ? "Submitting…" : submitLabel}
                        </button>

                        {status ? (
                            <p
                                role="status"
                                style={{
                                    margin: 0,
                                    color: didSucceed ? mutedTextColor : "#b91c1c",
                                    fontSize: bodyFont.fontSize,
                                }}
                            >
                                {status}
                            </p>
                        ) : null}

                        {!submissionEndpoint.trim() ? (
                            <p style={{ margin: 0, color: mutedTextColor, fontSize: 12 }}>
                                Implementation note: CMS save and admin email need a connected backend
                                endpoint.
                            </p>
                        ) : null}
                    </div>
                </form>
            </article>
        </section>
    )
}

addPropertyControls(OperaskQuoteRequestForm, {
    segmentName: { type: ControlType.String, defaultValue: "Campgrounds" },
    language: { type: ControlType.String, defaultValue: "English" },
    defaultCountry: { type: ControlType.String, defaultValue: "DE" },
    defaultCurrency: { type: ControlType.String, defaultValue: "EUR" },
    thankYouUrl: { type: ControlType.Link, defaultValue: "/thank-you" },
    submissionEndpoint: {
        type: ControlType.String,
        defaultValue: "",
        placeholder: "https://example.com/api/quote-request",
    },
    adminEmail: {
        type: ControlType.String,
        defaultValue: "sales@operask.com",
        placeholder: "sales@operask.com",
    },
    title: { type: ControlType.String, defaultValue: "Request a Quote" },
    submitLabel: { type: ControlType.String, defaultValue: "Submit Quote Request" },
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