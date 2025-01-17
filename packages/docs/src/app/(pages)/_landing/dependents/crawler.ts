import * as cheerio from 'cheerio'
import { unstable_cache } from 'next/cache'

enum PackageId {
  nuqs = 'UGFja2FnZS00MjczNzAxNTA5',
  nextUseQueryState = 'UGFja2FnZS0xMTYwOTg5NDIx'
}

export type Result = {
  repo: string
  stars: number
  pkg: string
  avatarID: string
}

export const crawlDependents = unstable_cache(
  _crawlDependents,
  ['crawlDependents'],
  {
    revalidate: 86_400
  }
)

async function _crawlDependents() {
  const tick = performance.now()
  const allResults: Result[] = []
  await Promise.allSettled([
    crawlPackageDependents(PackageId.nuqs, allResults),
    crawlPackageDependents(PackageId.nextUseQueryState, allResults)
  ])
  const out = allResults
    .sort((a, b) => b.stars - a.stars)
    .filter(
      // remove duplicates by repo
      (result, index, self) =>
        index === self.findIndex(r => r.repo === result.repo)
    )
    .slice(0, 100)
  console.log(`Dependents crawled in ${performance.now() - tick}ms`)
  return out
}

async function crawlPackageDependents(pkgId: string, allResults: Result[]) {
  let url = `https://github.com/47ng/nuqs/network/dependents?package_id=${pkgId}`
  while (true) {
    const { results, nextPage } = await crawlDependentsPage(url)
    allResults.push(...results)
    if (nextPage === null) {
      return
    }
    url = nextPage
  }
}

async function crawlDependentsPage(url: string) {
  const tick = performance.now()
  const pkg =
    new URLSearchParams(url.split('?')[1]).get('package_id') === PackageId.nuqs
      ? 'nuqs'
      : 'next-usequerystate'
  const html = await fetch(url, {
    cache: 'no-store'
  }).then(res => res.text())
  const endOfFetch = performance.now()
  const $ = cheerio.load(html)
  const endOfParse = performance.now()
  const results: Result[] = []
  $('[data-test-id="dg-repo-pkg-dependent"]').each((index, element) => {
    const img = $(element).find('img').attr('src') // ?.replace('s=40', 's=64')
    const avatarID = getAvatarID(img ?? '')
    const repoLink = $(element).find('a[data-hovercard-type="repository"]')
    const starsStr = $(element)
      .find('a[data-hovercard-type="repository"]')
      .parent()
      .next()
      .text()
      .trim()
    const ownerStr = $(element)
      .find('a[data-hovercard-type="repository"]')
      .prev()
      .text()
      .trim()
    const stars = parseInt(starsStr.replace(/,/g, ''), 10)
    if (
      !isNaN(stars) &&
      repoLink.length > 0 &&
      ownerStr.length > 0 &&
      avatarID
    ) {
      const repoName = repoLink.text()
      const repo = `${ownerStr}/${repoName}`
      if (!['franky47', '47ng'].includes(ownerStr)) {
        results.push({ repo, stars, pkg, avatarID })
      }
    }
  })
  const nextButton = $('div.paginate-container a:contains(Next)')
  const nextPage = nextButton?.attr('href') ?? null
  console.log(
    'Crawled page %s (fetch: %s, parse: %s, extract: %s)',
    url,
    (endOfFetch - tick).toFixed(2),
    (endOfParse - endOfFetch).toFixed(2),
    (performance.now() - endOfParse).toFixed(2)
  )
  return { results, nextPage }
}

const gitHubAvatarURLRegExp =
  /^https:\/\/avatars\.githubusercontent\.com\/u\/(\d+)\?/

function getAvatarID(src: string) {
  const match = src.match(gitHubAvatarURLRegExp)
  return match ? match[1] : undefined
}
