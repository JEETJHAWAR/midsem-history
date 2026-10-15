# Collects every sample question and answer into src-qa/01-qa.html.
# Run: python3 make_qa.py && node build.js --qa
import glob
import re


def blocks(s, cls):
    """Return every complete <div class="cls">...</div> block in s."""
    out, i, tag = [], 0, f'<div class="{cls}">'
    while (a := s.find(tag, i)) >= 0:
        depth, j = 0, a
        while True:
            o, c = s.find('<div', j), s.find('</div>', j)
            if o != -1 and o < c:
                depth, j = depth + 1, o + 4
            else:
                depth, j = depth - 1, c + 6
                if depth == 0:
                    break
        out.append(s[a:j])
        i = j
    return out


def part_head(letter, title, sub):
    return (f'<section class="session"><div class="session-head"><div class="session-num"><small>PART</small>{letter}</div>'
            f'<div class="session-title"><h1>{title}</h1><div class="readings">{sub}</div></div></div>')


front = open('src/00-front.html').read()
prof = front[front.find('<h3>Model short answer given in class'):front.find('<!-- ===================== COURSE STORY')]
prof = prof.replace('<span class="badge b-hi">Must know</span>', '')
essay_at = prof.find('<h3>Model essay plan given in class')
prof = prof[:essay_at] + '<div class="avoid">' + prof[essay_at:].rstrip() + '\n</div>\n'
template = blocks(front[front.find('<div class="box support"><span class="box-title">A reliable answer template'):], 'box support')[0]

session_answers = []
for f in sorted(glob.glob('src-lite/[01][0-9]-s*.html')):
    s = open(f).read()
    num = re.search(r'<small>SESSION</small>(\d+)', s).group(1)
    title = re.sub(r'<[^>]+>', '', re.search(r'<h1>(.*?)</h1>', s).group(1))
    for a in blocks(s, 'answer'):
        session_answers.append(f'<div class="avoid"><h2>Session {num} · {title}</h2>\n{a}\n</div>')

syn = open('src/12-synthesis.html').read()
strip_h2 = lambda t: re.sub(r'<h2>S\.\d[^\n]*</h2>', '', t)
short_plans = strip_h2(syn[syn.find('<h2>S.5'):syn.find('<h2>S.6')])
essay_plans = strip_h2(syn[syn.find('<h2>S.6'):syn.find('<h2>S.7')]).replace('see the front matter', 'see Part A')

html = [
    '''<div class="cover" style="min-height:auto"><div class="top">
<div class="kicker">BMS-01 · World &amp; Indian History · Mid-term</div>
<h1>History Midsem: <span>Model Answers</span></h1>
<div class="sub">All the sample questions and answers in one place: the professor's two models from class, one ready answer for every session, and extra answer and essay plans.</div>
</div></div>
<h2>How to use these answers</h2>''',
    template,
    '''<div class="box key"><span class="box-title">What's inside</span><ol class="tight">
<li><b>Part A</b>: the professor's own model short answer and model essay plan (given in class). Read these first, since they show exactly what the examiner wants.</li>
<li><b>Part B</b>: one full model answer for each session (1, 2, 3, 4, 6, 7, 8, 9, 10, 11).</li>
<li><b>Part C</b>: six more short-answer plans and four essay plans that mix sessions together.</li></ol>
<p>Don't memorise word for word. Learn the <b>structure</b> (thesis → points with scholar and example → "but" → conclusion) and the <b>names and examples</b>.</p></div>''',
    part_head('A', "The Professor's Model Answers (from class)", 'Read these first: they show the structure the examiner expects.'),
    prof, '</section>',
    part_head('B', 'One Model Answer for Every Session', 'Short answers are 10 marks; essays are 15 marks. Each answer follows the same shape: thesis → points with examples → "but" → conclusion.'),
    *session_answers, '</section>',
    part_head('C', 'More Answer Plans', 'Six more short answers and four essays that mix several sessions. Write each one as paragraphs, not bullet points.'),
    '<h2>Short-answer plans (10 marks)</h2>', short_plans,
    '<h2>Essay plans (15 marks)</h2>', essay_plans, '</section>',
]
out = '\n'.join(html)
open('src-qa/01-qa.html', 'w').write(out)
print(f'{len(session_answers)} session answers; <div {out.count("<div")} / </div> {out.count("</div>")}')
