import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  { 
    title: 'Add to context',
    Svg: require('@site/static/img/select-tool.svg').default,
    description: (
      <>
        With a right click, you can add your selection to the context to generate flashcards.
      </>
    ),
  },
  {
    title: 'Use previous chat history',
    Svg: require('@site/static/img/chat-square-arrow.svg').default,
    description: (
      <>
        Open up (chatGPT, Claude or Perplexity) and use your previous conversationsto generate flashcards out of it. 
      </>
    ),
  },
  {
    title: 'Import directly to anki',
    Svg: require('@site/static/img/import-content.svg').default,
    description: (
      <>
        Install our Anki add-on to import your generated flashcards directly into Anki.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
