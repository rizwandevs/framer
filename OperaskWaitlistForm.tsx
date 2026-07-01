import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// User request: Create a new Framer code component named OperaskWaitlistForm for /en/coming-soon as a visual-only waitlist form with required/optional fields, client-side validation, loading/success/error placeholder behavior (forceError), no backend calls, responsive SaaS styling, and configurable controls.

interface MyComponentProps {
    title: string
    subtitle: string
    submitLabel: string
    successMessage: string
    forceError: boolean
    defaultCountry: string
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

interface WaitlistFormState {
    fullName: string
    email: string
    country: string
    companyName: string
    segmentInterest: string
    message: string
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function OperaskWaitlistForm(props: MyComponentProps) {
    const {
        title,
        subtitle,
        submitLabel,
        successMessage,
        forceError,
        defaultCountry,
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

    const [form, setForm] = React.useState<WaitlistFormState>({
        fullName: "",
        email: "",
        country: defaultCountry,
        companyName: "",
        segmentInterest: "",
        message: "",
    })
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
    const [didSucceed, setDidSucceed] = React.useState<boolean>(false)
    const [statusMessage, setStatusMessage] = React.useState<string>("")

    React.useEffect(() => {
        React.startTransition(() => {
            setForm((previous) => ({ ...previous, country: previous.country || defaultCountry }))
        })
    }, [defaultCountry])

    const inputStyle = React.useMemo(
        () => ({
            width: "100%",
            boxSizing: "border-box" as const,
            border: `1px solid ${borderColor}`,
            borderRadius: Math.max(8, radius - 6),
            background: "#FFFFFF",
            color: textColor,
            padding: "11px 12px",
            fontSize: bodyFont.fontSize,
            lineHeight: bodyFont.lineHeight,
            letterSpacing: bodyFont.letterSpacing,
            fontWeight: bodyFont.fontWeight,
            fontStyle: bodyFont.fontStyle,
            textAlign: bodyFont.textAlign,
        }),
        [borderColor, radius, textColor, bodyFont]
    )

    const validateEmail = React.useCallback((value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }, [])

    const validate = React.useCallback(() => {
        const nextErrors: Record<string, string> = {}
        if (!form.fullName.trim()) nextErrors.fullName = "Please enter your full name."
        if (!form.email.trim()) {
            nextErrors.email = "Please enter your email address."
        } else if (!validateEmail(form.email.trim())) {
            nextErrors.email = "Please enter a valid email address."
        }
        if (!form.country.trim()) nextErrors.country = "Please enter your country."
        return nextErrors
    }, [form, validateEmail])

    const updateField = React.useCallback((field: keyof WaitlistFormState, value: string) => {
        React.startTransition(() => {
            setForm((previous) => ({ ...previous, [field]: value }))
            setErrors((previous) => {
                if (!previous[field]) return previous
                const next = { ...previous }
                delete next[field]
                return next
            })
            setStatusMessage("")
        })
    }, [])

    const mockSubmit = React.useCallback(async () => {
        await new Promise<void>((resolve) => {
            if (typeof window !== "undefined") {
                window.setTimeout(() => resolve(), 700)
            } else {
                resolve()
            }
        })
        return !forceError
    }, [forceError])

    const onSubmit = React.useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const validationErrors = validate()
            if (Object.keys(validationErrors).length > 0) {
                React.startTransition(() => {
                    setErrors(validationErrors)
                    setDidSucceed(false)
                    setStatusMessage("")
                })
                return
            }

            React.startTransition(() => {
                setIsSubmitting(true)
                setDidSucceed(false)
                setStatusMessage("")
            })

            const ok = await mockSubmit()
            if (ok) {
                React.startTransition(() => {
                    setDidSucceed(true)
                    setStatusMessage(successMessage)
                })
            } else {
                React.startTransition(() => {
                    setDidSucceed(false)
                    setStatusMessage("Something went wrong. Please try again.")
                })
            }

            React.startTransition(() => setIsSubmitting(false))
        },
        [mockSubmit, successMessage, validate]
    )

    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                background: backgroundColor,
                borderRadius: radius,
                padding: 20,
                boxSizing: "border-box",
                color: textColor,
            }}
        >
            <article
                style={{
                    width: "100%",
                    maxWidth: 720,
                    margin: "0 auto",
                    background: cardColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: radius,
                    padding: 18,
                    boxSizing: "border-box",
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        color: textColor,
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
                    {subtitle}
                </p>

                <form onSubmit={onSubmit} noValidate style={{ marginTop: 16 }}>
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
                                onChange={(event) => updateField("fullName", event.target.value)}
                                aria-invalid={Boolean(errors.fullName)}
                                style={inputStyle}
                            />
                            {errors.fullName ? (
                                <small style={{ color: "#B91C1C" }}>{errors.fullName}</small>
                            ) : null}
                        </label>

                        <label>
                            <span>Email</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) => updateField("email", event.target.value)}
                                aria-invalid={Boolean(errors.email)}
                                style={inputStyle}
                            />
                            {errors.email ? (
                                <small style={{ color: "#B91C1C" }}>{errors.email}</small>
                            ) : null}
                        </label>

                        <label>
                            <span>Country</span>
                            <input
                                type="text"
                                value={form.country}
                                onChange={(event) => updateField("country", event.target.value)}
                                aria-invalid={Boolean(errors.country)}
                                style={inputStyle}
                            />
                            {errors.country ? (
                                <small style={{ color: "#B91C1C" }}>{errors.country}</small>
                            ) : null}
                        </label>

                        <label>
                            <span>Company Name (Optional)</span>
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={(event) => updateField("companyName", event.target.value)}
                                style={inputStyle}
                            />
                        </label>

                        <label>
                            <span>Segment Interest (Optional)</span>
                            <input
                                type="text"
                                value={form.segmentInterest}
                                onChange={(event) =>
                                    updateField("segmentInterest", event.target.value)
                                }
                                style={inputStyle}
                            />
                        </label>
                    </div>

                    <label style={{ display: "block", marginTop: 12 }}>
                        <span>Message (Optional)</span>
                        <textarea
                            value={form.message}
                            onChange={(event) => updateField("message", event.target.value)}
                            rows={4}
                            style={{ ...inputStyle, resize: "vertical" }}
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
                                background: accentColor,
                                color: "#FFFFFF",
                                padding: "12px 14px",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                opacity: isSubmitting ? 0.6 : 1,
                                width: "100%",
                                fontSize: buttonFont.fontSize,
                                lineHeight: buttonFont.lineHeight,
                                letterSpacing: buttonFont.letterSpacing,
                                fontWeight: buttonFont.fontWeight,
                                fontStyle: buttonFont.fontStyle,
                                textAlign: buttonFont.textAlign,
                            }}
                        >
                            {isSubmitting ? "Submitting…" : submitLabel}
                        </button>

                        {statusMessage ? (
                            <p
                                role="status"
                                style={{
                                    margin: 0,
                                    color: didSucceed ? mutedTextColor : "#B91C1C",
                                    fontSize: bodyFont.fontSize,
                                }}
                            >
                                {statusMessage}
                            </p>
                        ) : null}
                    </div>
                </form>
            </article>
        </section>
    )
}

addPropertyControls(OperaskWaitlistForm, {
    title: { type: ControlType.String, defaultValue: "Join the Operask Waitlist" },
    subtitle: {
        type: ControlType.String,
        defaultValue: "We are launching in more regions soon. Sign up to be notified first.",
        displayTextArea: true,
    },
    submitLabel: { type: ControlType.String, defaultValue: "Join Waitlist" },
    successMessage: {
        type: ControlType.String,
        defaultValue: "Thank you. You have been added to the waitlist.",
    },
    forceError: { type: ControlType.Boolean, defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    defaultCountry: { type: ControlType.String, defaultValue: "" },
    backgroundColor: { type: ControlType.Color, defaultValue: "#F8FAFC" },
    cardColor: { type: ControlType.Color, defaultValue: "#FFFFFF" },
    borderColor: { type: ControlType.Color, defaultValue: "#DBEAFE" },
    textColor: { type: ControlType.Color, defaultValue: "#0F172A" },
    mutedTextColor: { type: ControlType.Color, defaultValue: "#64748B" },
    accentColor: { type: ControlType.Color, defaultValue: "#2563EB" },
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