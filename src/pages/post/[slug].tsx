/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Utterance from '../../components/Utterance';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  next_page: string | null;
  prev_page: string | null;
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

interface navigationPostsProps {
  propsNextPost?: {
    uid: string;
    title: string;
  };
  propsPreviousPost?: {
    uid: string;
    title: string;
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigationPosts: navigationPostsProps;
}

export default function Post({
  post,
  preview,
  navigationPosts,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const reduceIterator = post.data.content.reduce((acc, item) => {
      acc.textTotal += item.heading;
      acc.textTotal += RichText.asText(item.body);
      return acc;
    },
    { textTotal: '' }
  );

  const totalWordsInText = Math.ceil(
    reduceIterator.textTotal.split(' ').length / 200
  );
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

      <main className={`${styles.container} ${commonStyles.maxWidth1120}`}>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <section>
            <div>
              <time>
                <FiCalendar size={16} color="#d7d7d7" />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <FiUser size={16} color="#d7d7d7" />
                {post.data.author}
              </span>
              <time>
                <FiClock size={16} color="#d7d7d7" />
                {`${totalWordsInText} min`}
              </time>
            </div>

            <div className={styles.contentEdit}>
              <time>
                *
                {format(
                  new Date(post.last_publication_date),
                  " 'editado em' dd MMM yyyy', às' H':'mm",
                  {
                    locale: ptBR,
                  }
                )}
              </time>
            </div>
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

      <footer className={`${styles.baseboard} ${commonStyles.maxWidth720}`}>
        <hr />

        <div className={styles.containerBtnPages}>
          {navigationPosts.propsPreviousPost.uid && (
            <Link href={`/post/${navigationPosts.propsPreviousPost.uid}`}>
              <a className={`${commonStyles.btnload} ${styles.btnPagesBefore}`}>
                <span>{navigationPosts.propsPreviousPost.title}</span> <br />
                Post anterior
              </a>
            </Link>
          )}
          {navigationPosts.propsNextPost.uid && (
            <Link href={`/post/${navigationPosts.propsNextPost.uid}`}>
              <a className={`${commonStyles.btnload} ${styles.btnPagesAfter}`}>
                <span>{navigationPosts.propsNextPost.title}</span> <br />
                Próximo Post
              </a>
            </Link>
          )}
        </div>

        <Utterance />
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a
                className={`${styles.btnExitPreview} ${commonStyles.btnExitPreview}`}
              >
                Sair do modo Preview
              </a>
            </Link>
          </aside>
        )}
      </footer>
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
  const { previewData } = context;
  const { preview } = context;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const allPosts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.content', 'posts.author'],
      pageSize: 100,
      ref: previewData?.ref ?? null,
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
      after: response.id,
      orderings: '[my.posts.date desc]',
    }
  );

  const propsNextPost = nextPost.results.map(post => {
    return {
      uid: post.uid,
      title: post.data.title,
    };
  });

  const findIndexPageCurrent =
    allPosts.results.findIndex(post => post.uid === response.uid) - 1;

  const previousPage = allPosts.results[findIndexPageCurrent];

  const propsPreviousPage = {
    uid: previousPage?.uid ?? null,
    title: previousPage?.data.title ?? null,
  };

  console.log(propsPreviousPage)

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
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

  const ifNotExistsPropsNextPost = {
    uid: null,
    title: null,
  };

  return {
    props: {
      post,
      preview: preview || null,
      navigationPosts: {
        propsNextPost: propsNextPost[0]
          ? propsNextPost[0]
          : ifNotExistsPropsNextPost,
        propsPreviousPost: propsPreviousPage,
      },
    },
    revalidate: 60 * 30, // 30 min
  };
};
