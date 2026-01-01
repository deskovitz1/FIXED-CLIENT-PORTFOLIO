"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Send } from "lucide-react"

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(formData.subject || "Contact Form Submission")
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )
      const mailtoLink = `mailto:info@circusseventeen.com?subject=${subject}&body=${body}`
      
      // Open email client
      window.location.href = mailtoLink
      
      // Show success message
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: "", email: "", subject: "", message: "" })
      }, 3000)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/10 py-4 sm:py-6 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-xl md:text-2xl font-light tracking-tight hover:opacity-70 transition-opacity touch-manipulation">
            CIRCUS17
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <Link href="/videos" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors touch-manipulation min-h-[44px] flex items-center">
              Videos
            </Link>
            <Link href="/menu" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors touch-manipulation min-h-[44px] flex items-center">
              Menu
            </Link>
            <Link href="/contact" className="text-xs sm:text-sm text-red-500 font-medium touch-manipulation min-h-[44px] flex items-center">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-2">Get in Touch</h1>
            <p className="text-sm sm:text-base text-gray-400 px-4">
              Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-6 text-center">
              <p className="text-green-400 font-medium">Thank you for your message!</p>
              <p className="text-green-300 text-sm mt-2">
                Your email client should open shortly. If not, please email us at{" "}
                <a href="mailto:info@circusseventeen.com" className="underline">
                  info@circusseventeen.com
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors touch-manipulation"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-base bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors touch-manipulation"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors touch-manipulation"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 text-base bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none touch-manipulation"
                  placeholder="Tell us about your project or inquiry..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Or email us directly at{" "}
                <a href="mailto:info@circusseventeen.com" className="text-red-500 hover:text-red-400 underline">
                  info@circusseventeen.com
                </a>
              </p>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CIRCUS17. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

