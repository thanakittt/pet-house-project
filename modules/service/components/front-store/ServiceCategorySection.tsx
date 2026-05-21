"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog, Cat, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ServiceCategorySectionProps {
    title: string;
    icon: LucideIcon;
    iconBgColor: string;
    defaultTabValue: string;
    // รับ Component ของเนื้อหามาวาง
    dogContent: ReactNode;
    catContent: ReactNode;
    desktopContent: ReactNode;
}

export function ServiceCategorySection({
    title,
    icon: Icon,
    iconBgColor,
    defaultTabValue,
    dogContent,
    catContent,
    desktopContent,
}: ServiceCategorySectionProps) {
    return (
        <section className="flex flex-col gap-6">
            {/* Header Section */}
            <header className="flex items-center gap-3">
                <div className={`size-10 rounded-xl ${iconBgColor} flex items-center justify-center text-white shadow-md`}>
                    <Icon size={20} />
                </div>
                <h1 className="font-bold text-primary text-xl md:text-2xl">{title}</h1>
            </header>

            {/* 📱 Mobile: Tabs View */}
            <div className="md:hidden">
                <Tabs defaultValue={defaultTabValue} className="w-full">
                    <TabsList width="full" size="lg" className="mb-4">
                        <TabsTrigger
                            value={`${defaultTabValue.split('-')[0]}-dog`}
                        >
                            <Dog data-icon="inline-start" className="text-blue-500 dark:text-blue-300" />
                            <span className="truncate text-blue-500 dark:text-blue-300">สุนัข</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value={`${defaultTabValue.split('-')[0]}-cat`}
                        >
                            <Cat data-icon="inline-start" className="text-orange-500 dark:text-orange-300" />
                            <span className="truncate text-orange-500 dark:text-orange-300" >แมว</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value={`${defaultTabValue.split('-')[0]}-dog`}
                        className="mt-0 outline-none focus-visible:ring-0"
                    >
                        {dogContent}
                    </TabsContent>
                    <TabsContent
                        value={`${defaultTabValue.split('-')[0]}-cat`}
                        className="mt-0 outline-none focus-visible:ring-0"
                    >
                        {catContent}
                    </TabsContent>
                </Tabs>
            </div>

            {/* 💻 Desktop: Normal View */}
            <div className="hidden md:block">
                {desktopContent}
            </div>
        </section>
    );
}
