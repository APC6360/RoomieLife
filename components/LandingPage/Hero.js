import React from 'react';
import styled from 'styled-components';

const Hero = ({text}) => {
  return (
    <Section>
      <Overlay>
        <Container>
          <HeroTextColumn>
            <Header>
              {text}
              <Highlight>Start Here</Highlight>
            </Header>
            <SubheaderAndStarsColumn>
              <SubHeader>Insert creative subheader here</SubHeader>
              <CTAButton>Get Started</CTAButton>
            </SubheaderAndStarsColumn>
          </HeroTextColumn>
        </Container>
      </Overlay>
    </Section>
  );
};

const Section = styled.section`

width: 100%;
height: 10vh;
`;

const Overlay = styled.div`
`;

const Container = styled.div`
`;

const HeroTextColumn = styled.div`
`;

const Header = styled.h1`
`;

const Highlight = styled.span`
`;

const SubHeader = styled.h2`

`;

const SubheaderAndStarsColumn = styled.div`

`;

const CTAButton = styled.button`

`;

export default Hero;
