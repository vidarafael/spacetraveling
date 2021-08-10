import { useEffect, useRef } from 'react';

export default function Utterance() {
  const commentBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptEl = document.createElement('script');
    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute('repo', 'vidarafael/spacetraveling');
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'dark-blue');

    commentBox.current.appendChild(scriptEl);
  }, []);

  return <div ref={commentBox} />;
}
