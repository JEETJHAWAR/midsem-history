# Collects every sample question and answer into src-qa/01-qa.html (endsem edition).
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
template = blocks(front[front.find('<div class="box support"><span class="box-title">A reliable answer template'):], 'box support')[0]
rules = blocks(front[front.find('<div class="box key"><span class="box-title">The professor\'s rules'):], 'box key')[0]

# Part A: the professor's own discussion questions, with the short answer plan from each session's exam corner.
prof_qs = []
for f in sorted(glob.glob('src/[12][0-9]-session*.html')):
    s = open(f).read()
    num = re.search(r'<small>SESSION</small>(\d+)', s).group(1)
    title = re.sub(r'<[^>]+>', '', re.search(r'<h1>(.*?)</h1>', s).group(1))
    exam = blocks(s, 'box exam')
    if exam:
        body = exam[0].replace('<div class="box exam">', '<div class="box exam">', 1)
        body = re.sub(r'<p><b>MCQ traps:</b>.*?</p>', '', body, flags=re.S)
        prof_qs.append(f'<div class="avoid"><h2>Session {num} · {title}</h2>\n{body}\n</div>')

session_answers = []
for f in sorted(glob.glob('src-lite/[12][0-9]-s*.html')):
    s = open(f).read()
    m = re.search(r'<small>SESSION</small>(\d+)', s)
    if not m:
        continue
    title = re.sub(r'<[^>]+>', '', re.search(r'<h1>(.*?)</h1>', s).group(1))
    for a in blocks(s, 'answer'):
        session_answers.append(f'<div class="avoid"><h2>Session {m.group(1)} · {title}</h2>\n{a}\n</div>')

syn = open('src/30-synthesis.html').read()
strip_h2 = lambda t: re.sub(r'<h2>S\.\d[^\n]*</h2>', '', t)
short_plans = strip_h2(syn[syn.find('<h2>S.5'):syn.find('<h2>S.6')])
essay_plans = strip_h2(syn[syn.find('<h2>S.6'):syn.find('<h2>S.7')])

html = [
    '''<div class="cover" style="min-height:auto"><div class="top">
<div class="kicker">BMS-01 · World &amp; Indian History · End-term</div>
<h1>History Endsem: <span>Model Answers</span></h1>
<div class="sub">All the sample questions and answers in one place: the professor's own discussion questions from the Session 12–22 slides with answer plans, one full model answer for every session, and extra short-answer and essay plans.</div>
</div></div>
<h2>How to use these answers</h2>''',
    '<div class="grid2">', rules, template, '</div>',
    '''<div class="box key"><span class="box-title">What's inside</span><ol class="tight">
<li><b>Part A</b>: the professor's own discussion questions from the endsem slides, with answer plans. She asked these in class, so they are the most likely exam questions.</li>
<li><b>Part B</b>: one full model answer for each session (12, 13, 14, 15, 17, 18, 19, 20, 21, 22).</li>
<li><b>Part C</b>: ten more short-answer plans and four essay plans that mix sessions.</li></ol>
<p>Don't memorise word for word. Learn the <b>structure</b> (thesis → points with scholar and example → "but" → conclusion) and the <b>names, dates and examples</b>.</p></div>''',
    part_head('A', "The Professor's Own Questions (from the slides)", 'Each lecture ended with discussion questions or "food for thought". These are the plans for answering them.'),
    *prof_qs, '</section>',
    part_head('B', 'One Model Answer for Every Session', 'Short answers are 10 marks; essays are 15 marks. Each answer follows the same shape: thesis → points with examples → "but" → conclusion.'),
    *session_answers, '</section>',
    part_head('C', 'More Answer Plans', 'Ten more short answers and four essays that mix several sessions. Write each one as paragraphs, not bullet points.'),
    '<h2>Short-answer plans (10 marks)</h2>', short_plans,
    '<h2>Essay plans (15 marks)</h2>', essay_plans, '</section>',
]
out = '\n'.join(html)
open('src-qa/01-qa.html', 'w').write(out)
print(f'{len(prof_qs)} professor question blocks; {len(session_answers)} session answers; <div {out.count("<div")} / </div> {out.count("</div>")}')
