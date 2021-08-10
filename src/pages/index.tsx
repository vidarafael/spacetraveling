import { GetStaticProps } from 'next';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPagePrismic, setNextPagePrismic] = useState('');

  useEffect(() => {
    const formatPost = postsPagination.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    console.log(formatPost);

    setPosts([...formatPost]);
    setNextPagePrismic(postsPagination.next_page);
  }, []);

  async function handleClickPost() {
    const response: PostPagination = await fetch(nextPagePrismic).then(res => {
      return res.json();
    });

    if (nextPagePrismic) {
      const formatPost = response.results.map(post => {
        const newPost = {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
        return newPost;
      });
      setPosts([...posts, ...formatPost]);
      setNextPagePrismic(response.next_page);
    }
  }

  return nextPagePrismic ? (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <Header />

      <main className={`${styles.container} ${commonStyles.maxWidth1120}`}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar size={16} color="#d7d7d7" />
                  {post.first_publication_date}
                </time>
                <span>
                  <FiUser size={16} color="#d7d7d7" />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        <button
          className={commonStyles.btnload}
          type="button"
          onClick={handleClickPost}
        >
          Carregar mais posts
        </button>

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
      </main>
    </>
  ) : (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <Header />

      <main className={`${styles.container} ${commonStyles.maxWidth1120}`}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar className="icon" />
                  {post.first_publication_date}
                </time>
                <span>
                  <FiUser className="icon" />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

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
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.content', 'posts.author'],
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      ref: previewData?.ref ?? null,
    }
  );

  const { next_page } = postsResponse;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results,
      },
      preview,
    },
    revalidate: 60 * 30,
  };
};
