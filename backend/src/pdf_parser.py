"""PDF text extraction utilities."""

import fitz 
from pathlib import Path
from typing import Dict, List


class PDFParser:
    """Extract text content from PDF files."""

    @staticmethod
    def extract_text(pdf_path: Path) -> Dict[str, any]:
        """
        Extract text from a PDF file.
        """
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        doc = fitz.open(pdf_path)
        
        pages = []
        full_text = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append({
                "page_number": page_num + 1,
                "text": text
            })
            full_text.append(text)

        metadata = doc.metadata or {}
        doc.close()

        return {
            "text": "\n\n".join(full_text),
            "pages": pages,
            "metadata": {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
            },
            "num_pages": len(pages)
        }

    @staticmethod
    def extract_text_with_page_numbers(pdf_path: Path) -> List[Dict[str, any]]:
        """
        Extract text from PDF with page number preservation.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            List of dictionaries with page_number and text
        """
        result = PDFParser.extract_text(pdf_path)
        return result["pages"]
