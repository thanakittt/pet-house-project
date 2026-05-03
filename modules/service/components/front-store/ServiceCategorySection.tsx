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
    activeTabColor?: string; // เช่น text-blue-500 หรือ text-orange-500
}

export function ServiceCategorySection({
    title,
    icon: Icon,
    iconBgColor,
    defaultTabValue,
    dogContent,
    catContent,
    desktopContent,
    activeTabColor = "data-[state=active]:text-primary"
}: ServiceCategorySectionProps) {
    return (
        <section className="space-y-6">
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
                    <TabsList className="grid grid-cols-2 mb-4 p-1 w-full h-12">
                        <TabsTrigger
                            value={`${defaultTabValue.split('-')[0]}-dog`}
                            className="flex justify-center items-center gap-3 data-[state=active]:bg-white data-[state=active]:shadow-sm h-full font-bold data-[state=active]:text-blue-600 text-base transition-all"
                        >
                            <Dog size={20} className="text-blue-500 shrink-0" />
                            <span className="pt-0.5 leading-none">สุนัข</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value={`${defaultTabValue.split('-')[0]}-cat`}
                            className="flex justify-center items-center gap-3 data-[state=active]:bg-white data-[state=active]:shadow-sm h-full font-bold data-[state=active]:text-orange-500 text-base transition-all"
                        >
                            <Cat size={20} className="text-orange-500 shrink-0" />
                            <span className="pt-0.5 leading-none">แมว</span>
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