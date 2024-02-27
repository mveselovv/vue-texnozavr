<template>
  <section class="catalog">
  <ul class="catalog__list">
    <ProductItem v-for="product in products" :product="product" :key="product.id"/>
  </ul>
</section>
</template>

<script>
import ProductItem from './ProductItem.vue';

export default {
props: ['products'],
components: { ProductItem },
};

</script>
