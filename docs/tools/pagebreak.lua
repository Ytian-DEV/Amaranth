-- "\newpage" on its own line becomes a page break in DOCX and HTML (for the PDF).
-- Also: the document starts with a page break after the title block.
local function brk(fmt)
  if fmt:match('docx') then
    return pandoc.RawBlock('openxml', '<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
  elseif fmt:match('html') then
    return pandoc.RawBlock('html', '<div class="pagebreak"></div>')
  end
end

function Para(el)
  if #el.content == 1 and el.content[1].t == 'RawInline' and el.content[1].text:match('^\\newpage') then
    return brk(FORMAT)
  end
  if #el.content == 1 and el.content[1].t == 'Str' and el.content[1].text == '\\newpage' then
    return brk(FORMAT)
  end
end

function RawBlock(el)
  if el.text:match('^\\newpage') then
    return brk(FORMAT)
  end
end

function Pandoc(doc)
  if FORMAT:match('docx') then
    table.insert(doc.blocks, 1, pandoc.RawBlock('openxml', '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'))
  end
  return doc
end
