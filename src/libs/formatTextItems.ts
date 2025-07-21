type TextFormat = "link" | "strong" | "italic" | "strike" | "plain" | "nestedPlain" | "checkbox" | "nestedCheckbox" | "paragraph1";

export type TextItem = {
    content: string;
    format: TextFormat;
};

export const formatTextItems = (items: TextItem[]): string => {
    return items
        .map(({ content, format }) => {
            switch (format) {
                case "link":
                    return `#${content}`;
                case "strong":
                    return `[* ${content}]`;
                case "italic":
                    return `[/ ${content}]`;
                case "strike":
                    return `[  ${content}]`;
                case "plain":
                    return content;
                case "nestedPlain":
                    return `  ${content}`;
                case "checkbox":
                    return ` ⬜${content}`;
                case "nestedCheckbox":
                    return `  ⬜${content}`;
                case "paragraph1":
                    return ` ${content}`;
                default: {
                    const exhaustiveCheck: never = format;
                    throw new Error(`Unsupported format: ${exhaustiveCheck}`);
                }
            }
        })
        .join("\n");
};
