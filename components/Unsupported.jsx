import { ExternalLink } from './ExternalLink.jsx';
import { GithubIcon } from './Icons.jsx';

import styles from './Unsupported.module.scss';
const imageUrl = new URL('../images/sad_kilroy.png', import.meta.url);

/**
 * @param {{ unsupported: JSX.Element[] } & React.HTMLAttributes<HTMLDivElement>}
 */
export function Unsupported({
  unsupported,
  ...props
}) {
  return (
    <div className={styles.root} {...props}>
      <h1>Unsupported Features</h1>
      <p>
        It looks like your browser may have trouble running NPMGraph.
        Specifically, the following features appear to be missing or disabled:
      </p>
      <ul>
        {unsupported.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
      <p>
        Make sure you're using a modern version of Chrome, Firefox, Safari, or
        Edge, and that cookies are enabled.
      </p>

      <p className={styles.footer}>
        <ExternalLink
          href="https://github.com/npmgraph/npmgraph"
          icon={GithubIcon}
        >
          NPMGraph on GitHub
        </ExternalLink>
      </p>

      <img className={styles.sad_kilroy} width="100" src={imageUrl.href} />
    </div>
  );
}
