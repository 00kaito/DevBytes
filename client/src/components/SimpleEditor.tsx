import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Bold, Italic, Underline, Type, Palette } from "lucide-react";

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SimpleEditor({ value, onChange, placeholder }: SimpleEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const insertTag = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = 
      value.substring(0, start) + 
      startTag + selectedText + endTag + 
      value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: "Pogrubienie",
      action: () => insertTag("<strong>", "</strong>")
    },
    {
      icon: Italic,
      label: "Kursywa",
      action: () => insertTag("<em>", "</em>")
    },
    {
      icon: Underline,
      label: "Podkreślenie",
      action: () => insertTag("<u>", "</u>")
    },
    {
      icon: Type,
      label: "Duży nagłówek",
      action: () => insertTag("<h2>", "</h2>")
    },
    {
      icon: Type,
      label: "Mały nagłówek",
      action: () => insertTag("<h3>", "</h3>")
    }
  ];

  const colorButtons = [
    { color: "#dc2626", name: "Czerwony" },
    { color: "#2563eb", name: "Niebieski" },
    { color: "#16a34a", name: "Zielony" },
    { color: "#ca8a04", name: "Żółty" },
    { color: "#7c3aed", name: "Fioletowy" }
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border rounded-lg">
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={button.action}
            title={button.label}
            className="h-8 px-2"
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Color buttons */}
        <span className="text-sm text-slate-600 mr-2">Kolory:</span>
        {colorButtons.map((color) => (
          <Button
            key={color.color}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTag(`<span style="color: ${color.color}">`, "</span>")}
            title={color.name}
            className="h-8 w-8 p-0"
            style={{ backgroundColor: color.color }}
          >
            <Palette className="h-3 w-3 text-white" />
          </Button>
        ))}

        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Preview toggle */}
        <Button
          type="button"
          variant={showPreview ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-8"
        >
          {showPreview ? "Edycja" : "Podgląd"}
        </Button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <Card className="p-4 min-h-[200px] bg-white">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value || "<em>Brak treści do wyświetlenia</em>" }}
          />
        </Card>
      ) : (
        <Textarea
          id="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Wpisz opis używając tagów HTML..."}
          className="min-h-[200px] font-mono text-sm"
        />
      )}

      {/* HTML Help */}
      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer hover:text-slate-800">
          Przykładowe tagi HTML (kliknij aby rozwinąć)
        </summary>
        <div className="mt-2 p-3 bg-slate-50 rounded border space-y-1">
          <div><code>&lt;strong&gt;tekst&lt;/strong&gt;</code> - <strong>pogrubienie</strong></div>
          <div><code>&lt;em&gt;tekst&lt;/em&gt;</code> - <em>kursywa</em></div>
          <div><code>&lt;u&gt;tekst&lt;/u&gt;</code> - <u>podkreślenie</u></div>
          <div><code>&lt;h2&gt;Nagłówek&lt;/h2&gt;</code> - duży nagłówek</div>
          <div><code>&lt;h3&gt;Nagłówek&lt;/h3&gt;</code> - mały nagłówek</div>
          <div><code>&lt;span style="color: red"&gt;tekst&lt;/span&gt;</code> - <span style={{color: 'red'}}>kolorowy tekst</span></div>
          <div><code>&lt;p&gt;paragraf&lt;/p&gt;</code> - paragraf</div>
          <div><code>&lt;br&gt;</code> - nowa linia</div>
          <div><code>&lt;ul&gt;&lt;li&gt;punkt&lt;/li&gt;&lt;/ul&gt;</code> - lista punktowana</div>
        </div>
      </details>
    </div>
  );
}