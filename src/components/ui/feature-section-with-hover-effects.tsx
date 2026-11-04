import React from "react";
import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconHeart,
  IconHelp,
  IconLeaf,
  IconMassage,
  IconSparkles,
  IconStars,
  IconTool,
} from "@tabler/icons-react";

export type FeatureItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export function FeaturesSectionWithHoverEffects({
  features,
}: {
  features?: FeatureItem[];
}) {
  const defaultFeatures: FeatureItem[] = [
    {
      title: "Premium Materialien",
      description: "Kuratierte Gua Sha Tools aus Edelstahl, Xiu Jade und ausgewählten Materialien für ein hochwertiges Ritual mit spürbarer Qualität.",
      icon: <IconTool />,
    },
    {
      title: "Moderne Selfcare-Rituale",
      description: "Reduzierte Routinen, klare Anwendung und ein bewusstes Pflegegefühl statt überladener Beauty-Gimmicks.",
      icon: <IconMassage />,
    },
    {
      title: "Skin-First Fokus",
      description: "Entwickelt für entspannte Gesichtszüge, definierte Konturen und ein ruhiges, hochwertiges Ritual im Alltag.",
      icon: <IconSparkles />,
    },
    {
      title: "Editorial statt Mainstream",
      description: "GUA SHOP steht für eine ruhige, minimalistische Ästhetik mit Premium-Anspruch statt klassischem Shop-Overload.",
      icon: <IconStars />,
    },
    {
      title: "The Steel & Xiu Jade",
      description: "Unser V1-Fokus: zwei kuratierte Hero-Produkte, klar inszeniert und bewusst statt beliebig erweitert.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "The Rose kommt bald",
      description: "The Rose ist bereits Teil der Kollektion und wird als nächste Preview bewusst und kontrolliert eingeführt.",
      icon: <IconLeaf />,
    },
    {
      title: "How To & Compare",
      description: "Nicht nur kaufen: Verstehen, vergleichen und das passende Tool für dein eigenes Ritual bewusst auswählen.",
      icon: <IconHelp />,
    },
    {
      title: "Built for Ritual",
      description: "Weniger Produkte, mehr Klarheit: GUA SHOP verbindet hochwertige Tools mit einer ruhigen, modernen Ritual-Perspektive.",
      icon: <IconHeart />,
    },
  ];

  const items = features?.length ? features : defaultFeatures;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {items.map((feature, index) => (
        <Feature key={`${feature.title}-${index}`} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
