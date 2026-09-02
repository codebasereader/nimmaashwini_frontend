import SectionHeading from "../ui/SectionHeading";

export default function VoteofThanks() {
  return (
    <section className="relative bg-olive-900 section-padding">
      <div className="container-ashwini relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <div className="order-2 lg:order-1">
            <SectionHeading
              label="A Note of Gratitude"
              title="Thank You for Being Part of Our Journey"
              className="[&_.section-label]:text-gold-400 [&_.section-label_svg]:text-gold-300 [&_.section-label_span:first-child]:text-gold-500"
              titleClassName="text-white"
            />

            <div className="relative mt-6 sm:mt-8">
              <span
                aria-hidden="true"
                className="font-display pointer-events-none absolute -top-4 -left-1 text-6xl leading-none text-olive-700/60 select-none sm:-top-6 sm:text-7xl"
              >
                &ldquo;
              </span>

              <p className="relative text-[1.0625rem] leading-[1.85] font-medium text-cream-200 sm:text-[1.125rem] lg:text-[1.1875rem]">
                Every product we create is a promise — of purity, tradition, and
                care passed down through generations. When you choose Nimma
                Ashwini, you are not simply buying from a brand; you are
                becoming part of a family that believes in natural living and
                honest wellness.
              </p>

              <p className="mt-5 text-[1.0625rem] leading-[1.85] font-medium text-cream-200 sm:text-[1.125rem] lg:text-[1.1875rem]">
                From the bottom of our hearts, thank you for your trust, your
                kindness, and for welcoming our Natural heritage into your
                home. Your support keeps our craft alive and inspires us to
                serve you with the same devotion, batch after batch.
              </p>

              <p className="mt-8 font-display text-xl text-gold-400 italic sm:text-2xl">
                — With warmth, Team Nimma Ashwini
              </p>

              <div
                aria-hidden="true"
                className="mt-8 h-px w-24 bg-linear-to-r from-gold-500 to-transparent"
              />
            </div>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-2xl border border-gold-300/40 sm:-inset-4"
              />
              <div
                aria-hidden="true"
                className="absolute -right-3 -bottom-3 h-full w-full rounded-2xl bg-olive-950/50 sm:-right-4 sm:-bottom-4"
              />

              <div className="relative overflow-hidden rounded-2xl bg-cream-100 shadow-card">
                <img
                  src="/thankyou_anp.webp"
                  alt="The founders of Nimma Ashwini, smiling warmly"
                  width={900}
                  height={1125}
                  className="aspect-[4/5] w-full object-cover object-center"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
