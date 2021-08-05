import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  console.log(router.isFallback);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const reduceIterator = post.data.content.reduce(
    (acc, item) => {
      if (item.body) {
        const valueTextBody = item.body.reduce((accumulator, data) => {
          accumulator += data.text.length;
          return accumulator;
        }, 0);
        acc.textBody = valueTextBody;
      }
      if (item.heading) {
        acc.textHeading += item.heading.length;
      }
      acc.total = acc.textBody + acc.textHeading;
      return acc;
    },
    {
      textBody: 0,
      textHeading: 0,
      total: 0,
    }
  );

  const minutesToRead = Math.ceil(reduceIterator.total / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <div className={styles.divHeader}>
        <Header />
      </div>

      <div className={styles.containerImg}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <main className={styles.container}>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <section>
            <time>
              <FiCalendar size={16} color="#d7d7d7" />
              {post.first_publication_date}
            </time>
            <span>
              <FiUser size={16} color="#d7d7d7" />
              {post.data.author}
            </span>
            <time>
              <FiClock size={16} color="#d7d7d7" />
              {minutesToRead} min
            </time>
          </section>

          {post.data.content.map(data => (
            <div key={data.heading} className={styles.mainContent}>
              <h2>{data.heading}</h2>
              <div
                className={styles.postContent}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(data.body) }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const postResults = posts.results.slice(0, 2);

  const paths = postResults.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(data => {
        return {
          heading: data.heading,
          body: [...data.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 min
  };
};
