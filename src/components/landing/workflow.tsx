'use client';

import { motion } from 'framer-motion';
import {
  Upload,
  FileSearch,
  FolderUp,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Tender',
    description: 'Upload the tender or procurement document (PDF) you want to bid on.',
  },
  {
    icon: FileSearch,
    title: 'Extract Requirements',
    description:
      'AI reads the document and extracts every eligibility, compliance, and qualification requirement.',
  },
  {
    icon: FolderUp,
    title: 'Upload Your Documents',
    description:
      'Upload your company documents — financials, certifications, experience letters, and more.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify Compliance',
    description:
      'A rules engine and AI jointly evaluate each requirement against your evidence, with traceable explanations.',
  },
  {
    icon: BarChart3,
    title: 'Get Readiness Score',
    description:
      'See your overall bid-readiness score, risk level, and an auditable compliance report you can act on.',
  },
];

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Workflow() {
  return (
    <section id="workflow" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-semibold uppercase tracking-widest text-primary"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            From document to decision in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Five clear steps between uploading a tender and knowing whether
            you&apos;re ready to bid.
          </motion.p>
        </div>

        {/* Steps */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          {/* Connector line (desktop) */}
          <div className="absolute top-12 left-12 right-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {steps.map((step, idx) => (
              <motion.div key={step.title} variants={item} className="relative text-center lg:text-center">
                {/* Step number */}
                <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-muted-foreground/60">
                    Step {idx + 1}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
