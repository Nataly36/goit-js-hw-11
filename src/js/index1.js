import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import { createMarkup } from './createMarkup';
import { PixabayAPI } from './PixabayAPI';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  btnLoadMore: document.querySelector('.load-more'),
  backdrop: document.querySelector('.backdrop'),
  btnUp: document.getElementById('to-top-btn'),
  btnUpWrapper: document.querySelector('.btn-up'),
  searchInput: document.querySelector('.search-form-input'),
};
const notifyInit = {
  width: '250px',
  position: 'right-bottom',
  distance: '20px',
  timeout: 1500,
  opacity: 0.8,
  fontSize: '16px',
  borderRadius: '50px',
};

const modalLightboxGallery = new SimpleLightbox('.gallery a', {
  captionDelay: 250,
});
refs.btnLoadMore.classList.add('is-hidden');

const pixaby = new PixabayAPI();

const options = {
  root: null,
  rootMargin: '100px',
  threshold: 1.0,
};


const loadMorePhotos = async function (entries, observer) {
    entries.forEach(async entry => {
        if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            pixaby.incrementPage();

      
            try {
      

                const { hits } = await pixaby.getPhotos();
                const markup = createMarkup(hits);
                refs.gallery.insertAdjacentHTML('beforeend', markup);

       
                if (pixaby.hasMorePhotos) {
                    const lastItem = document.querySelector('.gallery a:last-child');
                    observer.observe(lastItem);
                } else
                    Notify.info(
                        "We're sorry, but you've reached the end of search results.",
                        notifyInit
                    );

                modalLightboxGallery.refresh();
                scrollPage();
            } catch (error) {
                Notify.failure(error.message, 'Something went wrong!', notifyInit);
                clearPage();
            } finally {
        
           }
    }
  });
};


const observer = new IntersectionObserver(loadMorePhotos, options);

const onSubmitClick = async event => {
  event.preventDefault();

  const {
    elements: { searchQuery },
  } = event.target;

  const search_query = searchQuery.value.trim().toLowerCase();

  if (!search_query) {
    clearPage();
    Notify.info('Enter data to search!', notifyInit);

    refs.searchInput.placeholder = 'What`re we looking for?';
    return;
  }

  pixaby.query = search_query;

  clearPage();

  try {
    
    const { hits, total } = await pixaby.getPhotos();

    if (hits.length === 0) {
      Notify.failure(
        `Sorry, there are no images matching your ${search_query}. Please try again.`,
        notifyInit
      );

      return;
    }

    const markup = createMarkup(hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);

    pixaby.setTotal(total);
    Notify.success(`Hooray! We found ${total} images.`, notifyInit);

    if (pixaby.hasMorePhotos) {
      

      const lastItem = document.querySelector('.gallery a:last-child');
      observer.observe(lastItem);
    }

    modalLightboxGallery.refresh();
    
  } catch (error) {
     Notify.failure(error.message, 'Something went wrong!', notifyInit);

    clearPage();
  } 
};

const onLoadMore = async () => {
  pixaby.incrementPage();

  if (!pixaby.hasMorePhotos) {
    refs.btnLoadMore.classList.add('is-hidden');
    Notify.info("We're sorry, but you've reached the end of search results.");
    notifyInit;
  }
  try {
    const { hits } = await pixaby.getPhotos();
    const markup = createMarkup(hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);

    modalLightboxGallery.refresh();
  } catch (error) {
    Notify.failure(error.message, 'Something went wrong!', notifyInit);

    clearPage();
  }
};

function clearPage() {
  pixaby.resetPage();
  refs.gallery.innerHTML = '';
  refs.btnLoadMore.classList.add('is-hidden');
}

refs.form.addEventListener('submit', onSubmitClick);
refs.btnLoadMore.addEventListener('click', onLoadMore);

//  smooth scrolling
function scrollPage() {
  const { height: cardHeight } = document
    .querySelector('.photo-gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

//Button smooth scroll up

window.addEventListener('scroll', scrollFunction);

function scrollFunction() {
  if (document.body.scrollTop > 15 || document.documentElement.scrollTop > 15) {
    refs.btnUpWrapper.style.display = 'flex';
  } else {
    refs.btnUpWrapper.style.display = 'none';
  }
}
refs.btnUp.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});