import React from 'react';
import './IndexPage.css'; // 引入样式文件
import logo from '../assets/logo/logo.png'; // 确保路径正确
import 'bootstrap/dist/css/bootstrap.min.css'; // 引入 Bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // 引入 Bootstrap 图标
import FeatureCard from '../components/FeatureCard'; // 导入 FeatureCard 组件

const IndexPage = () => {
    return (
        <div>
            {/* 项目标题和简介 */}
            <header className="py-5 text-center bg-light">
                <div className="container">
                    <h1 className="display-4 fw-bold">BALANCE Dashboard</h1>
                    <img src={logo} alt="Logo" className="img-fluid" style={{ maxWidth: '300px', height: 'auto' }} />
                    <p className="lead mt-3">
                        A cutting-edge platform empowering researchers and improving lives of adolescent and young adult cancer survivors through data-driven insights.
                    </p>
                    <p className="text-muted">
                        Developed as part of the BALANCE Project, in collaboration with Griffith University and Canteen.
                    </p>
                    <a href="/login" className="btn btn-primary btn-lg hero-btn">Get Started</a>
                </div>
            </header>

            {/* 特征介绍 */}
            <section className="py-5">
                <div className="container">
                    <h2 className="text-center mb-4">Key Features</h2>
                    <div className="row text-center">
                        <FeatureCard
                            icon="bi-bar-chart"
                            title="Advanced Data Visualization"
                            description="Transform complex datasets into interactive visualizations to uncover patterns and trends effortlessly."
                        />
                        <FeatureCard
                            icon="bi-person"
                            title="User-Centered Design"
                            description="Designed with researchers and survivors in mind, ensuring a seamless and intuitive user experience."
                        />
                        <FeatureCard
                            icon="bi-shield-lock"
                            title="Secure Data Management"
                            description="Guaranteed data integrity and privacy, following industry-leading security standards."
                        />
                    </div>
                </div>
            </section>

            {/* 开源信息 */}
            <section className="py-5">
                <div className="container text-center">
                    <h2>Open Source and Community-Driven</h2>
                    <p className="text-muted mt-3">
                        The BALANCE Dashboard is open-source and thrives on community contributions. Join us in enhancing the impact of data-driven research.
                    </p>
                    <a
                        href="https://github.com/yulin-wu-UQ/balance_end"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-primary"
                    >
                        Contribute on GitHub
                    </a>
                </div>
            </section>

            {/* 作者信息 */}
            <section className="py-5 bg-light">
                <div className="bg-light p-3 rounded text-center">
                    <div className="d-flex align-items-center justify-content-center">
                        <i className="bi bi-person-circle fs-1 text-primary me-3"></i>
                        <div>
                            <h6 className="mb-1 fw-bold">Created by Yulin Wu</h6>
                            <p className="mb-0 text-muted">
                                Email:{' '}
                                <a href="mailto:s4565901@student.uq.edu.au" className="text-decoration-none text-primary">
                                    s4565901@student.uq.edu.au
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="footer py-4 mt-auto">
                <div className="container text-center">
                    <p className="mb-0">© 2024 BALANCE Project. Open-source under the MIT License.</p>
                </div>
            </footer>
        </div>
    );
};

export default IndexPage;
